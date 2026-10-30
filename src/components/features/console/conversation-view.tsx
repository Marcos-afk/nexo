"use client";

import type { ConsoleConversationProps } from "@/models/console";
import { useConsoleConversation, useMarkRead } from "@/viewmodels/use-console-conversation";
import { useConversationActions } from "@/viewmodels/use-conversation-actions";
import { useConversationSearch } from "@/viewmodels/use-conversation-search";
import { usePanelPreference } from "@/viewmodels/use-panel-preference";
import { useTypingConversations } from "@/viewmodels/use-typing-conversations";
import { CaseSummary } from "./case-summary";
import { ConversationActions } from "./conversation-actions";
import { ConversationFooter } from "./conversation-footer";
import { ConversationHeader } from "./conversation-header";
import { ConversationMessages } from "./conversation-messages";
import { ConversationSearch } from "./conversation-search";
import { TicketsPanel } from "./tickets-panel";
import { UsageLine } from "./usage-line";

interface ConversationViewProps {
  readonly initial: ConsoleConversationProps;
  readonly decisionMessageId: string | null;
}

export function ConversationView({ initial, decisionMessageId }: ConversationViewProps) {
  const { conversation, refresh } = useConsoleConversation(initial);
  const actions = useConversationActions({ conversationId: conversation.id, onDone: refresh });
  const panel = usePanelPreference();
  const search = useConversationSearch(conversation.messages);
  const isTyping = useTypingConversations().has(conversation.id);

  useMarkRead(conversation);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ConversationHeader
          conversation={conversation}
          isTyping={isTyping}
          actions={
            <ConversationActions
              conversation={conversation}
              actions={actions}
              isPanelOpen={panel.isOpen}
              onTogglePanel={panel.onToggle}
              onSearch={search.onOpen}
            />
          }
        />
        {search.isOpen && <ConversationSearch {...search} />}
        <CaseSummary conversation={conversation} />
        <UsageLine usage={conversation.usage} />
        <ConversationMessages
          messages={conversation.messages}
          employeeName={conversation.employee.name}
          focus={{
            highlightQuery: search.highlightQuery,
            activeMessageId: search.activeMessageId,
            decisionMessageId,
          }}
        />
        <ConversationFooter conversation={conversation} actions={actions} />
      </div>
      {panel.isOpen && <TicketsPanel conversationId={conversation.id} onClose={panel.onClose} />}
    </div>
  );
}
