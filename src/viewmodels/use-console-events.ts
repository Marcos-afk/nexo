import { useEffect, useEffectEvent } from "react";
import { REFRESH_THROTTLE_MS } from "@/constants/console";
import { useConsoleEventsContext } from "@/providers/console-events-provider";
import { eventSignalSchema } from "@/schemas/console";
import { parseEventData } from "@/utils/parse-event";

export function useConsoleEvents(onChange: () => void, conversationId?: string) {
  const { subscribe } = useConsoleEventsContext();
  const notify = useEffectEvent(onChange);
  const isRelevant = useEffectEvent((raw: unknown): boolean => {
    if (conversationId === undefined) {
      return true;
    }

    const data = parseEventData(raw, eventSignalSchema);

    return data === null || data.conversationId === conversationId;
  });

  useEffect(() => {
    const state = { timer: null as ReturnType<typeof setTimeout> | null };
    const unsubscribe = subscribe((raw) => {
      if (state.timer !== null || !isRelevant(raw)) {
        return;
      }

      state.timer = setTimeout(() => {
        state.timer = null;
        notify();
      }, REFRESH_THROTTLE_MS);
    });

    return () => {
      unsubscribe();

      if (state.timer !== null) {
        clearTimeout(state.timer);
      }
    };
  }, [subscribe]);
}
