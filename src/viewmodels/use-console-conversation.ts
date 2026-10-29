import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CONVERSATION_LOAD_ERROR, conversationPathOf } from "@/constants/console";
import { api } from "@/lib/api";
import type { ConsoleConversationProps } from "@/models/console";
import { conversationResponseSchema } from "@/schemas/console";
import { lastEmployeeMessageIdOf } from "@/utils/console-conversation";
import { errorMessageOf } from "@/utils/error-message";
import { useConsoleEvents } from "./use-console-events";

const noContentSchema = z.void();

export function useConsoleConversation(initial: ConsoleConversationProps) {
  const [conversation, setConversation] = useState(initial);
  const conversationId = initial.id;

  const refresh = useEffectEvent(async () => {
    try {
      const next = await api.get(conversationPathOf(conversationId), conversationResponseSchema);

      setConversation(next.conversation);
    } catch (error) {
      toast.error(errorMessageOf(error, CONVERSATION_LOAD_ERROR));
    }
  });

  useConsoleEvents(() => void refresh(), conversationId);

  return { conversation, refresh };
}

export function useMarkRead(conversation: ConsoleConversationProps) {
  const lastEmployeeId = lastEmployeeMessageIdOf(conversation.messages);
  const markRead = useEffectEvent(() => {
    void api.post(`${conversationPathOf(conversation.id)}/read`, undefined, noContentSchema);
  });

  useEffect(() => {
    if (lastEmployeeId !== null) {
      markRead();
    }
  }, [lastEmployeeId]);
}
