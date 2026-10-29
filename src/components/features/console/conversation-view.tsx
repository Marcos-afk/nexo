"use client";

import type { ConsoleConversationProps } from "@/models/console";
import { isAssignedToViewer, needsCloseConfirmation } from "@/utils/console-conversation";
import { useConsoleConversation, useMarkRead } from "@/viewmodels/use-console-conversation";
import { useConversationActions } from "@/viewmodels/use-conversation-actions";
import { AttendanceActions } from "./attendance-actions";
import { AttendanceBar } from "./attendance-bar";
import { ConversationHeader } from "./conversation-header";
import { ConversationMessages } from "./conversation-messages";
import { ReplyComposer } from "./reply-composer";

interface ConversationViewProps {
  readonly initial: ConsoleConversationProps;
}

export function ConversationView({ initial }: ConversationViewProps) {
  const { conversation, refresh } = useConsoleConversation(initial);
  const actions = useConversationActions({ conversationId: conversation.id, onDone: refresh });
  const isMine = isAssignedToViewer(conversation);

  useMarkRead(conversation);

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader
        conversation={conversation}
        actions={
          isMine && (
            <AttendanceActions
              actions={actions}
              needsConfirmation={needsCloseConfirmation(conversation)}
            />
          )
        }
      />
      <ConversationMessages
        messages={conversation.messages}
        employeeName={conversation.employee.name}
      />
      <footer className="flex flex-col gap-3 border-t border-rule px-6 py-4">
        <AttendanceBar conversation={conversation} actions={actions} />
        <ReplyComposer isLocked={!isMine} isBusy={actions.isBusy} onSend={actions.onReply} />
      </footer>
    </div>
  );
}
