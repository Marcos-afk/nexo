"use client";

import { useState } from "react";
import type { ConsoleConversationProps } from "@/models/console";
import { useConsoleConversation, useMarkRead } from "@/viewmodels/use-console-conversation";
import { useConversationActions } from "@/viewmodels/use-conversation-actions";
import { useConversationSearch } from "@/viewmodels/use-conversation-search";
import { CaseSummary } from "./case-summary";
import { ConversationActions } from "./conversation-actions";
import { ConversationFooter } from "./conversation-footer";
import { ConversationHeader } from "./conversation-header";
import { ConversationMessages } from "./conversation-messages";
import { ConversationSearch } from "./conversation-search";
import { TicketsPanel } from "./tickets-panel";

interface ConversationViewProps {
  readonly initial: ConsoleConversationProps;
  readonly decisionMessageId: string | null;
}

export function ConversationView({ initial, decisionMessageId }: ConversationViewProps) {
  const { conversation, refresh } = useConsoleConversation(initial);
  const actions = useConversationActions({ conversationId: conversation.id, onDone: refresh });
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const search = useConversationSearch(conversation.messages);

  useMarkRead(conversation);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ConversationHeader
          conversation={conversation}
          actions={
            <ConversationActions
              conversation={conversation}
              actions={actions}
              isPanelOpen={isPanelOpen}
              onTogglePanel={() => setIsPanelOpen((current) => !current)}
              onSearch={search.onOpen}
            />
          }
        />
        {search.isOpen && <ConversationSearch {...search} />}
        <CaseSummary conversation={conversation} />
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
      {isPanelOpen && (
        <TicketsPanel conversationId={conversation.id} onClose={() => setIsPanelOpen(false)} />
      )}
    </div>
  );
}
