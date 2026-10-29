import { useEffect, useEffectEvent } from "react";
import { EVENTS_ENDPOINT } from "@/constants/chat";
import { REFRESH_THROTTLE_MS } from "@/constants/console";

const REFRESH_EVENTS = ["message.created", "conversation.updated", "resync"] as const;

export function useConsoleEvents(onChange: () => void) {
  const notify = useEffectEvent(onChange);

  useEffect(() => {
    const source = new EventSource(EVENTS_ENDPOINT);
    const state = { timer: null as ReturnType<typeof setTimeout> | null };
    const schedule = () => {
      if (state.timer === null) {
        state.timer = setTimeout(() => {
          state.timer = null;
          notify();
        }, REFRESH_THROTTLE_MS);
      }
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
