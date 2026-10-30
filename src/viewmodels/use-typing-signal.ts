import { useRef } from "react";
import { z } from "zod";
import { TYPING_ENDPOINT, TYPING_SIGNAL_INTERVAL_MS } from "@/constants/chat";
import { api } from "@/lib/api";

const noContentSchema = z.void();

export function useTypingSignal() {
  const lastSentAt = useRef<number | null>(null);

  return () => {
    const now = Date.now();

    if (lastSentAt.current !== null && now - lastSentAt.current < TYPING_SIGNAL_INTERVAL_MS) {
      return;
    }

    lastSentAt.current = now;
    void api.post(TYPING_ENDPOINT, undefined, noContentSchema);
  };
}
