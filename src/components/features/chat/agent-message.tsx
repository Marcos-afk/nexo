import { AUTHOR_LABELS } from "@/constants/chat";
import type { ChatAttachmentProps, ChatLineProps } from "@/models/chat";
import { ActionLine } from "./action-line";
import { AttachmentView } from "./attachment-view";
import { DecisionPanel } from "./decision-panel";
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
  const choices = line.attachments.filter((attachment) => attachment.kind === "choices");
  const others = line.attachments.filter((attachment) => attachment.kind !== "choices");
  const renderAttachment = (attachment: ChatAttachmentProps) => (
    <AttachmentView
      key={attachment.key}
      attachment={attachment}
      isSendDisabled={isSendDisabled}
      onSend={onSend}
    />
  );

  return (
    <div className="flex flex-col gap-1.5">
      <ActionLine
        author={line.analyst?.name ?? AUTHOR_LABELS[line.authorKind]}
        actions={line.actions}
        badge={isAnalyst ? <AnalystBadge level={line.analyst?.level ?? null} /> : null}
      />
      {(line.text || choices.length > 0) && (
        <div className="flex max-w-150 flex-col gap-3 rounded-xl rounded-tl-sm border border-rule bg-paper px-4 py-3 text-[14.5px] leading-normal text-ink">
          {line.text && <MarkdownText text={line.text} />}
          {choices.map(renderAttachment)}
        </div>
      )}
      {others.map(renderAttachment)}
      {line.authorKind === "agent" && <DecisionPanel messageId={line.id} />}
    </div>
  );
}
