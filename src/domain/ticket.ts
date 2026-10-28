export const ticketTypes = ["incident", "request"] as const;

export const ticketStatuses = [
  "open",
  "in_progress",
  "awaiting_analyst",
  "in_service",
  "approved",
  "resolved",
] as const;

export const ticketEventKinds = [
  "created",
  "updated",
  "reopened",
  "transferred",
  "assumed",
  "resolved",
] as const;

export type TicketType = (typeof ticketTypes)[number];
export type TicketStatus = (typeof ticketStatuses)[number];
export type TicketEventKind = (typeof ticketEventKinds)[number];
