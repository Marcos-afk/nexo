import { useEffect, useEffectEvent } from "react";
import { EVENTS_ENDPOINT } from "@/constants/chat";
import { REFRESH_THROTTLE_MS } from "@/constants/console";
import { eventSignalSchema } from "@/schemas/console";
import { parseEventData } from "@/utils/parse-event";

const REFRESH_EVENTS = ["message.created", "conversation.updated", "resync"] as const;

export function useConsoleEvents(onChange: () => void, conversationId?: string) {
  const notify = useEffectEvent(onChange);
  const isRelevant = useEffectEvent((raw: unknown): boolean => {
    if (conversationId === undefined) {
      return true;
    }

    const data = parseEventData(raw, eventSignalSchema);

    return data === null || data.conversationId === conversationId;
  });

  useEffect(() => {
    const source = new EventSource(EVENTS_ENDPOINT);
    const state = { timer: null as ReturnType<typeof setTimeout> | null };
    const schedule = (event: MessageEvent) => {
      if (state.timer !== null || !isRelevant(event.data)) {
        return;
      }

      state.timer = setTimeout(() => {
        state.timer = null;
        notify();
      }, REFRESH_THROTTLE_MS);
    };

    for (const type of REFRESH_EVENTS) {
      source.addEventListener(type, schedule);
    }

    return () => {
      source.close();

      if (state.timer !== null) {
        clearTimeout(state.timer);
      }
    };
  }, []);
}
