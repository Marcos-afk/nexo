import { ALL_STATUSES_LABEL, NO_TICKETS_LABEL } from "@/constants/console";
import { type TicketStatus, ticketStatuses, ticketStatusLabels } from "@/domain/ticket";
import type { ConversationTicketsProps } from "@/models/console";
import { TicketRow } from "./ticket-row";

interface TicketsAllProps {
  readonly tickets: ConversationTicketsProps;
  readonly status: TicketStatus | "all";
  readonly onStatusChange: (status: TicketStatus | "all") => void;
  readonly onOpen: (number: string) => void;
}

const isStatus = (value: string): value is TicketStatus =>
  ticketStatuses.some((status) => status === value);

export function TicketsAll({ tickets, status, onStatusChange, onOpen }: TicketsAllProps) {
  const visible = tickets.tickets.filter((item) => status === "all" || item.status === status);

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
      <label className="flex flex-col gap-1 px-2.5 text-xs text-ink-3">
        Status
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(isStatus(event.target.value) ? event.target.value : "all")
          }
          className="h-9 rounded-md border border-rule bg-paper px-2 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="all">{ALL_STATUSES_LABEL}</option>
          {ticketStatuses.map((option) => (
            <option key={option} value={option}>
              {ticketStatusLabels[option]}
            </option>
          ))}
        </select>
      </label>
      {visible.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-3">{NO_TICKETS_LABEL}</p>
      ) : (
        <ul className="flex flex-col">
          {visible.map((item) => (
            <TicketRow key={item.number} item={item} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </div>
  );
}
