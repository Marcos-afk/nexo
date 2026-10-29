import type { ChatStatus, UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SYNC_ERROR } from "@/constants/chat";
import { fetchChatHistory, fetchChatSession } from "@/lib/chat-history";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { mergeExternalMessages } from "@/utils/merge-messages";

export type SyncKind = "append" | "resync";

export type SetMessages = (update: UIMessage[] | ((current: UIMessage[]) => UIMessage[])) => void;

interface UseHistorySyncProps {
  readonly status: ChatStatus;
  readonly setMessages: SetMessages;
  readonly onResync: (session: ChatSession, history: readonly UIMessage[]) => void;
  readonly retry: (kind: SyncKind) => void;
}

export function useHistorySync({ status, setMessages, onResync, retry }: UseHistorySyncProps) {
  const latestStatus = useRef(status);

  useEffect(() => {
    latestStatus.current = status;
  }, [status]);

  return async (kind: SyncKind) => {
    try {
      const history = await fetchChatHistory();
      const session = kind === "resync" ? await fetchChatSession() : null;

      if (latestStatus.current !== "ready") {
        retry(kind);
      } else if (session) {
        setMessages(history);
        onResync(session, history);
      } else {
        setMessages((current) => mergeExternalMessages(current, history));
      }
    } catch {
      toast.error(SYNC_ERROR);
    }
  };
}
