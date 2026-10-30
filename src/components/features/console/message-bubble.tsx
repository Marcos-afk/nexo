import { cx } from "class-variance-authority";
import { ArrowRightLeft, Check, CheckCheck, Headset } from "lucide-react";
import { DecisionPanel } from "@/components/features/chat/decision-panel";
import { AGENT_BADGE_LABEL } from "@/constants/console";
import type { ConsoleMessageProps } from "@/models/console";
import { authorLabelOf, splitByQuery } from "@/utils/console-conversation";
import { clockTimeOf } from "@/utils/console-format";

const ICON_SIZE = 14;

export const messageElementIdOf = (messageId: string): string => `message-${messageId}`;

interface HighlightedTextProps {
  readonly text: string;
  readonly query: string;
}

function HighlightedText({ text, query }: HighlightedTextProps) {
  return splitByQuery(text, query).map((segment) =>
    segment.isMatch ? (
      <mark key={segment.start} className="rounded-sm bg-warning px-0.5 text-ink">
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

interface MessageBubbleProps {
  readonly message: ConsoleMessageProps;
  readonly employeeName: string;
  readonly highlightQuery: string;
  readonly isActive: boolean;
  readonly isDecisionOpen: boolean;
}

interface TicksProps {
  readonly isRead: boolean;
}

function Ticks({ isRead }: TicksProps) {
  return isRead ? (
    <CheckCheck size={ICON_SIZE} aria-label="Lida pelo funcionário" className="text-primary" />
  ) : (
    <Check size={ICON_SIZE} aria-label="Enviada" className="text-ink-3" />
  );
}

interface SenderTagProps {
  readonly className: string;
  readonly children: React.ReactNode;
}

function SenderTag({ className, children }: SenderTagProps) {
  return (
    <span className={cx("rounded-sm px-1.5 py-px text-[11px] font-semibold", className)}>
      {children}
    </span>
  );
}

function AuthorBadge({ message }: { readonly message: ConsoleMessageProps }) {
  if (message.authorKind === "agent") {
    return <SenderTag className="bg-primary-soft text-primary-text">{AGENT_BADGE_LABEL}</SenderTag>;
  }

  return message.authorKind === "analyst" && message.authorLevel ? (
    <SenderTag className="bg-success-soft text-success-text">
      Suporte {message.authorLevel}
    </SenderTag>
  ) : null;
}

const SYSTEM_ICONS: readonly (readonly [RegExp, typeof Headset])[] = [
  [/assumiu/i, Headset],
  [/transferid/i, ArrowRightLeft],
];

const SYSTEM_ICON_SIZE = 13;

export function SystemLine({ message }: { readonly message: ConsoleMessageProps }) {
  const Icon = SYSTEM_ICONS.find(([pattern]) => pattern.test(message.content))?.[1];

  return (
    <div className="flex items-center gap-3 pt-2 text-[12px] font-medium text-ink-3">
      <span aria-hidden="true" className="h-px flex-1 bg-ink/8" />
      <p className="flex items-center gap-1.5 text-center">
        {Icon && <Icon size={SYSTEM_ICON_SIZE} aria-hidden="true" />}
        {message.content} · {clockTimeOf(message.createdAt)}
      </p>
      <span aria-hidden="true" className="h-px flex-1 bg-ink/8" />
    </div>
  );
}

const BUBBLE_CLASSES = {
  employee: "max-w-130 rounded-tl-sm bg-paper",
  agent: "max-w-105 rounded-tr-sm bg-bubble-agent",
  analyst: "max-w-105 rounded-tr-sm bg-bubble-analyst",
  system: "max-w-130 rounded-tl-sm bg-paper",
} as const satisfies Record<ConsoleMessageProps["authorKind"], string>;

export function MessageBubble({
  message,
  employeeName,
  highlightQuery,
  isActive,
  isDecisionOpen,
}: MessageBubbleProps) {
  const isEmployee = message.authorKind === "employee";

  return (
    <div
      id={messageElementIdOf(message.id)}
      className={cx(
        "flex flex-col gap-1 rounded-xl",
        isEmployee ? "items-start" : "items-end",
        isActive && "bg-warning-soft ring-4 ring-warning-soft",
      )}
    >
      {!isEmployee && (
        <span className="flex items-center gap-1.5 px-1 text-[12px] font-semibold text-ink-2">
          {authorLabelOf(message, employeeName)}
          <AuthorBadge message={message} />
        </span>
      )}
      <div
        className={cx(
          "flex gap-2.5 rounded-xl px-3 pt-2 pb-1.5 text-[14.5px] leading-[1.45] text-ink shadow-xs",
          BUBBLE_CLASSES[message.authorKind],
          isEmployee ? "items-end" : "flex-col items-end",
        )}
      >
        <span className="whitespace-pre-wrap">
          <HighlightedText text={message.content} query={highlightQuery} />
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-ink-3">
          {clockTimeOf(message.createdAt)}
          {message.readByEmployee !== null && <Ticks isRead={message.readByEmployee} />}
        </span>
      </div>
      {message.authorKind === "agent" && (
        <DecisionPanel messageId={message.id} initiallyOpen={isDecisionOpen} />
      )}
    </div>
  );
}
