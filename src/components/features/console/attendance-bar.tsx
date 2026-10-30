import { Bot, Hand, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AGENT_ACTIVE_LABEL,
  ASSUME_LABEL,
  ASSUMED_BY_OTHER_LABEL,
  CLOSED_LABEL,
  RETURN_LABEL,
} from "@/constants/console";
import type { ConsoleConversationProps, ConversationActionsProps } from "@/models/console";
import { dueLabelOf, isAssignedToOther } from "@/utils/console-conversation";

const HAND_SIZE = 17;
const BUTTON_ICON_SIZE = 15;

interface AttendanceBarProps {
  readonly conversation: ConsoleConversationProps;
  readonly actions: ConversationActionsProps;
}

function WaitingBar({ conversation, actions }: AttendanceBarProps) {
  const due = dueLabelOf(conversation.contactDueAt);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-soft px-4 py-3">
      <Hand size={HAND_SIZE} aria-hidden="true" className="shrink-0 text-warning-text" />
      <p className="min-w-0 flex-1 text-sm font-semibold text-warning-text">
        {conversation.employee.name} espera um atendente · Agent pausado{due ? ` · ${due}` : ""}
      </p>
      <Button.Root
        variant="outline"
        onClick={actions.onReturn}
        disabled={actions.isBusy}
        className="h-9 gap-1.5 rounded-lg pr-3 pl-2.5"
      >
        <Bot size={BUTTON_ICON_SIZE} aria-hidden="true" className="text-ink-2" />
        {RETURN_LABEL}
      </Button.Root>
      <Button.Root
        onClick={actions.onAssume}
        disabled={actions.isBusy}
        className="h-9 gap-1.5 rounded-lg pr-3 pl-2.5"
      >
        <Headset size={16} aria-hidden="true" />
        {ASSUME_LABEL}
      </Button.Root>
    </div>
  );
}

const infoTextOf = (conversation: ConsoleConversationProps): string | null => {
  if (conversation.mode === "agent") {
    return AGENT_ACTIVE_LABEL;
  }

  if (conversation.mode === "closed") {
    return CLOSED_LABEL;
  }

  return isAssignedToOther(conversation) ? ASSUMED_BY_OTHER_LABEL : null;
};

export function AttendanceBar({ conversation, actions }: AttendanceBarProps) {
  if (conversation.mode === "awaiting_analyst") {
    return <WaitingBar conversation={conversation} actions={actions} />;
  }

  const info = infoTextOf(conversation);

  return info && <p className="rounded-xl bg-card px-4 py-3 text-sm text-ink-3">{info}</p>;
}
