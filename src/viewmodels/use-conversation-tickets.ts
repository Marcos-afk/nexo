import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";
import { TICKETS_LOAD_ERROR, ticketsPathOf } from "@/constants/console";
import { api } from "@/lib/api";
import type { ConversationTicketsProps } from "@/models/console";
import { ticketsResponseSchema } from "@/schemas/console";
import { errorMessageOf } from "@/utils/error-message";
import { useConsoleEvents } from "./use-console-events";

export function useConversationTickets(conversationId: string) {
  const [tickets, setTickets] = useState<ConversationTicketsProps | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const refresh = useEffectEvent(async (id: string, signal?: AbortSignal) => {
    try {
      const response = await api.get(ticketsPathOf(id), ticketsResponseSchema, signal);

      setTickets(response.tickets);
      setHasFailed(false);
    } catch (error) {
      if (!signal?.aborted) {
        setHasFailed(true);
        toast.error(errorMessageOf(error, TICKETS_LOAD_ERROR));
      }
    }
  });

  useConsoleEvents(() => void refresh(conversationId), conversationId);

  useEffect(() => {
    const controller = new AbortController();

    void refresh(conversationId, controller.signal);

    return () => controller.abort();
  }, [conversationId]);

  return { tickets, hasFailed };
}
