export const modelStates = ["ok", "rate_limited", "unavailable"] as const;
export const ticketSystemStates = ["ok", "unavailable"] as const;
export const assistantStatuses = ["online", "degraded", "offline"] as const;

export type ModelState = (typeof modelStates)[number];
export type TicketSystemState = (typeof ticketSystemStates)[number];
export type AssistantStatus = (typeof assistantStatuses)[number];

export interface HealthReport {
  readonly status: AssistantStatus;
  readonly model: ModelState;
  readonly tickets: TicketSystemState;
  readonly checkedAt: string;
}

export const assistantStatusOf = (
  model: ModelState,
  tickets: TicketSystemState,
): AssistantStatus => {
  if (model !== "ok") {
    return "offline";
  }

  return tickets === "ok" ? "online" : "degraded";
};
