import { parseOfficeDateTime } from "@/domain/sla";
import type { TicketDetailView } from "@/domain/ticket-view";
import { formatRelativeTime } from "@/utils/relative-time";
import { useNow } from "./use-now";

export function useTicketCard(ticket: TicketDetailView) {
  const now = useNow();
  const updatedAt = parseOfficeDateTime(ticket.updatedAt);

  return {
    updatedRelative: now && updatedAt ? formatRelativeTime(updatedAt, now) : null,
  };
}
