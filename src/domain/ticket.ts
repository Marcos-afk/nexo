import type { TicketPriority } from "./sla";
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

export interface Ticket {
  readonly id: string;
  readonly number: string;
  readonly type: TicketType;
  readonly category: string;
  readonly subcategory: string | null;
  readonly title: string;
  readonly description: string;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly ownerId: string;
  readonly affected: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly dueAt: Date;
  readonly resolvedAt: Date | null;
}
