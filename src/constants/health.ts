import type { AssistantStatus } from "@/domain/health";

export const HEALTH_ENDPOINT = "/api/health";
export const HEALTH_POLL_INTERVAL_MS = 30_000;

export const ASSISTANT_STATUS_LABELS = {
  online: "Assistente online",
  degraded: "Assistente com limitações",
  offline: "Assistente offline",
} as const satisfies Record<AssistantStatus, string>;
