import { Check, Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import type { ChatActionProps, ChatActionStatusType } from "@/models/chat";

const ICON_SIZE = 12;

const ACTION_ICONS = {
  running: <Loader2 size={ICON_SIZE} aria-hidden="true" className="animate-spin text-ink-3" />,
  done: <Check size={ICON_SIZE} aria-hidden="true" className="text-success" />,
  failed: <X size={ICON_SIZE} aria-hidden="true" className="text-danger" />,
} as const satisfies Record<ChatActionStatusType, ReactNode>;

const ACTION_STATUS_LABELS = {
  running: "em andamento",
  done: "concluído",
  failed: "falhou",
} as const satisfies Record<ChatActionStatusType, string>;

interface ActionLineProps {
  readonly author: string;
  readonly actions: readonly ChatActionProps[];
  readonly badge?: ReactNode;
}

export function ActionLine({ author, actions, badge }: ActionLineProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="flex items-center gap-1.5 font-semibold text-ink">
        {author}
        {badge}
      </span>
      {actions.map((action) => (
        <span key={action.key} className="flex items-center gap-1.25 text-ink-3">
          {ACTION_ICONS[action.status]}
          {action.label}
          <span className="sr-only">({ACTION_STATUS_LABELS[action.status]})</span>
        </span>
      ))}
    </div>
  );
}
