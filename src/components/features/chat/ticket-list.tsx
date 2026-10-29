import { Badge } from "@/components/ui/badge";
import type { TicketSummaryView } from "@/domain/ticket-view";
import { toneOfTicketStatus } from "@/utils/ticket-status";

const CHOICE_SEPARATOR = " · ";

interface TicketListProps {
  readonly tickets: readonly TicketSummaryView[];
  readonly isDisabled: boolean;
  readonly onSelect: (text: string) => void;
}

export function TicketList({ tickets, isDisabled, onSelect }: TicketListProps) {
  return (
    <ul
      aria-label="Seus chamados"
      className="flex w-full max-w-150 flex-col overflow-hidden rounded-xl border border-rule bg-paper"
    >
      {tickets.map((ticket) => (
        <li key={ticket.number} className="border-b border-rule last:border-b-0">
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(`${ticket.number}${CHOICE_SEPARATOR}${ticket.title}`)}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="font-data text-xs font-semibold text-ink-2">{ticket.number}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{ticket.title}</span>
            <Badge.Root tone={toneOfTicketStatus(ticket.status)}>{ticket.status}</Badge.Root>
            <span className="hidden text-xs whitespace-nowrap text-ink-3 sm:inline">
              {ticket.updatedAt}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
