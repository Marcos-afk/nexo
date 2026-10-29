import { AUTHOR_LABELS } from "@/constants/chat";
import type { ChatLineProps } from "@/models/chat";
import { ActionLine } from "./action-line";

interface AgentMessageProps {
  readonly line: ChatLineProps;
}

const ANALYST_BADGE_LABEL = "Suporte";

function AnalystBadge() {
  return (
    <span className="rounded-sm bg-violet-soft px-1.5 py-px text-xs font-semibold text-violet-text">
      {ANALYST_BADGE_LABEL}
    </span>
  );
}

export function AgentMessage({ line }: AgentMessageProps) {
  const isAnalyst = line.authorKind === "analyst";

  return (
    <div className="flex flex-col gap-1.5">
      <ActionLine
        author={AUTHOR_LABELS[line.authorKind]}
        actions={line.actions}
        badge={isAnalyst ? <AnalystBadge /> : null}
      />
      {line.text && (
        <p className="max-w-150 rounded-xl rounded-tl-sm border border-rule bg-paper px-4 py-3 text-sm leading-normal whitespace-pre-wrap text-ink">
          {line.text}
        </p>
      )}
    </div>
  );
}
