import { AUTHOR_LABELS } from "@/constants/chat";
import type { ChatLineProps } from "@/models/chat";
import { ActionLine } from "./action-line";
import { AttachmentView } from "./attachment-view";
import { MarkdownText } from "./markdown-text";

interface AgentMessageProps {
  readonly line: ChatLineProps;
  readonly isSendDisabled: boolean;
  readonly onSend: (text: string) => void;
}

const ANALYST_BADGE_LABEL = "Suporte";

interface AnalystBadgeProps {
  readonly level: string | null;
}

function AnalystBadge({ level }: AnalystBadgeProps) {
  return (
    <span className="rounded-sm bg-violet-soft px-1.5 py-px text-xs font-semibold text-violet-text">
      {level ? `${ANALYST_BADGE_LABEL} ${level}` : ANALYST_BADGE_LABEL}
    </span>
  );
}

export function AgentMessage({ line, isSendDisabled, onSend }: AgentMessageProps) {
  const isAnalyst = line.authorKind === "analyst";

  return (
    <div className="flex flex-col gap-1.5">
      <ActionLine
        author={line.analyst?.name ?? AUTHOR_LABELS[line.authorKind]}
        actions={line.actions}
        badge={isAnalyst ? <AnalystBadge level={line.analyst?.level ?? null} /> : null}
      />
      {line.text && (
        <div className="flex max-w-150 flex-col gap-2 rounded-xl rounded-tl-sm border border-rule bg-paper px-4 py-3 text-sm leading-normal text-ink">
          <MarkdownText text={line.text} />
        </div>
      )}
      {line.attachments.map((attachment) => (
        <AttachmentView
          key={attachment.key}
          attachment={attachment}
          isSendDisabled={isSendDisabled}
          onSend={onSend}
        />
      ))}
    </div>
  );
}
