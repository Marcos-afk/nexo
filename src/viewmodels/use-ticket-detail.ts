import { useEffect, useState } from "react";
import { TICKET_LOAD_ERROR, ticketPathOf } from "@/constants/console";
import { api } from "@/lib/api";
import type { ConsoleTicketDetailProps } from "@/models/console";
import { ticketDetailResponseSchema } from "@/schemas/console";
import { errorMessageOf } from "@/utils/error-message";

interface TicketDetailState {
  readonly number: string;
  readonly detail: ConsoleTicketDetailProps | null;
  readonly error: string | null;
}

export function useTicketDetail(conversationId: string, number: string | null) {
  const [state, setState] = useState<TicketDetailState | null>(null);

  useEffect(() => {
    if (number === null) {
      return;
    }

    const controller = new AbortController();

    api
      .get(ticketPathOf(conversationId, number), ticketDetailResponseSchema, controller.signal)
      .then((response) => setState({ number, detail: response.detail, error: null }))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setState({ number, detail: null, error: errorMessageOf(cause, TICKET_LOAD_ERROR) });
        }
      });

    return () => controller.abort();
  }, [conversationId, number]);

  return state !== null && state.number === number ? state : null;
}
