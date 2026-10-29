import { useEffect, useState } from "react";
import { HEALTH_ENDPOINT, HEALTH_POLL_INTERVAL_MS } from "@/constants/health";
import type { AssistantStatus } from "@/domain/health";
import { api } from "@/lib/api";
import { healthResponseSchema } from "@/schemas/health";

export function useAssistantStatus(initialStatus: AssistantStatus) {
  const [status, setStatus] = useState<AssistantStatus | null>(initialStatus);

  useEffect(() => {
    const controller = new AbortController();

    const refresh = () =>
      api
        .get(HEALTH_ENDPOINT, healthResponseSchema, controller.signal)
        .then((response) => setStatus(response.health.status))
        .catch(() => setStatus(null));

    const timer = setInterval(refresh, HEALTH_POLL_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);

  return { status };
}
