import { cx } from "class-variance-authority";
import { Check, CheckCheck } from "lucide-react";
import { DecisionPanel } from "@/components/features/chat/decision-panel";
import { Badge } from "@/components/ui/badge";
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

function AuthorBadge({ message }: { readonly message: ConsoleMessageProps }) {
  if (message.authorKind === "agent") {
    return <Badge.Root tone="neutral">{AGENT_BADGE_LABEL}</Badge.Root>;
  }

  return message.authorKind === "analyst" && message.authorLevel ? (
    <Badge.Root tone="violet">Suporte {message.authorLevel}</Badge.Root>
  ) : null;
}

export function SystemLine({ message }: { readonly message: ConsoleMessageProps }) {
  return (
    <div className="flex justify-center">
      <p className="rounded-full bg-card px-3 py-1 text-center text-xs text-ink-3">
        {message.content} · {clockTimeOf(message.createdAt)}
      </p>
    </div>
  );
}

export function MessageBubble({
  message,
  employeeName,
  highlightQuery,
  isActive,
  isDecisionOpen,
}: MessageBubbleProps) {
  const isAnalyst = message.authorKind === "analyst";

  return (
    <div
      id={messageElementIdOf(message.id)}
      className={cx(
        "flex flex-col gap-1 rounded-xl",
        isAnalyst ? "items-end" : "items-start",
        isActive && "bg-warning-soft ring-4 ring-warning-soft",
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
        {authorLabelOf(message, employeeName)}
        <AuthorBadge message={message} />
      </span>
      <div
        className={
          isAnalyst
            ? "max-w-130 rounded-xl rounded-tr-sm bg-ink px-4 py-2.5 text-sm leading-normal whitespace-pre-wrap text-white"
            : "max-w-130 rounded-xl rounded-tl-sm border border-rule bg-paper px-4 py-2.5 text-sm leading-normal whitespace-pre-wrap text-ink"
        }
      >
        <HighlightedText text={message.content} query={highlightQuery} />
      </div>
      <span className="flex items-center gap-1 text-xs text-ink-3">
        {clockTimeOf(message.createdAt)}
        {message.readByEmployee !== null && <Ticks isRead={message.readByEmployee} />}
      </span>
      {message.authorKind === "agent" && (
        <DecisionPanel messageId={message.id} initiallyOpen={isDecisionOpen} />
      )}
    </div>
  );
}
