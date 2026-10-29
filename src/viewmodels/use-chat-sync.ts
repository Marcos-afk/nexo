import type { ChatStatus, UIMessage } from "ai";
import { useEffect, useState } from "react";
import type { ConversationMode, MessageAuthorKind } from "@/domain/conversation";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { useChatEvents } from "./use-chat-events";
import { type SetMessages, type SyncKind, useHistorySync } from "./use-history-sync";

interface UseChatSyncProps {
  readonly status: ChatStatus;
  readonly setMessages: SetMessages;
  readonly onMode: (mode: ConversationMode) => void;
  readonly onResync: (session: ChatSession, history: readonly UIMessage[]) => void;
}

const FROM_OTHERS: ReadonlySet<MessageAuthorKind> = new Set(["analyst", "system"]);

export function useChatSync({ status, setMessages, onMode, onResync }: UseChatSyncProps) {
  const [pending, setPending] = useState<SyncKind | null>(null);
  const request = (kind: SyncKind) =>
    setPending((current) => (current === "resync" ? current : kind));
  const sync = useHistorySync({ status, setMessages, onResync, retry: request });

  useChatEvents({
    onMessage: (authorKind) => {
      if (FROM_OTHERS.has(authorKind)) {
        request("append");
      }
    },
    onMode,
    onResync: () => request("resync"),
  });

  useEffect(() => {
    if (pending !== null && status === "ready") {
      setPending(null);
      void sync(pending);
    }
  }, [pending, status, sync]);
}
