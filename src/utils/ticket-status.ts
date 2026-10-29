import { TICKET_STATUS_TONES } from "@/constants/ticket";
import { type TicketStatus, ticketStatuses, ticketStatusLabels } from "@/domain/ticket";
import type { BadgeToneType } from "@/models/ticket";

const STATUS_BY_LABEL: ReadonlyMap<string, TicketStatus> = new Map(
  ticketStatuses.map((status) => [ticketStatusLabels[status], status]),
);

export const toneOfTicketStatus = (label: string): BadgeToneType => {
  const status = STATUS_BY_LABEL.get(label);

  return status === undefined ? "neutral" : TICKET_STATUS_TONES[status];
};
