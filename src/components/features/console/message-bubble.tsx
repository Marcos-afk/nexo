import { Check, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AGENT_BADGE_LABEL } from "@/constants/console";
import type { ConsoleMessageProps } from "@/models/console";
import { authorLabelOf } from "@/utils/console-conversation";
import { clockTimeOf } from "@/utils/console-format";

const ICON_SIZE = 14;

interface MessageBubbleProps {
  readonly message: ConsoleMessageProps;
  readonly employeeName: string;
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

export function MessageBubble({ message, employeeName }: MessageBubbleProps) {
  const isAnalyst = message.authorKind === "analyst";

  return (
    <div
      className={isAnalyst ? "flex flex-col items-end gap-1" : "flex flex-col items-start gap-1"}
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
        {message.content}
      </div>
      <span className="flex items-center gap-1 text-xs text-ink-3">
        {clockTimeOf(message.createdAt)}
        {message.readByEmployee !== null && <Ticks isRead={message.readByEmployee} />}
      </span>
    </div>
  );
}
