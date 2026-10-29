import type { ConsoleConversationProps, ConversationActionsProps } from "@/models/console";
import { isAssignedToViewer } from "@/utils/console-conversation";
import { AttendanceBar } from "./attendance-bar";
import { ReplyComposer } from "./reply-composer";

interface ConversationFooterProps {
  readonly conversation: ConsoleConversationProps;
  readonly actions: ConversationActionsProps;
}

export function ConversationFooter({ conversation, actions }: ConversationFooterProps) {
  return (
    <footer className="flex flex-col gap-3 border-t border-rule px-6 py-4">
      <AttendanceBar conversation={conversation} actions={actions} />
      <ReplyComposer
        isLocked={!isAssignedToViewer(conversation)}
        isBusy={actions.isBusy}
        onSend={actions.onReply}
      />
    </footer>
  );
}
