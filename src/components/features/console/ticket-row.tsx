import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NO_EVENT_LABEL } from "@/constants/console";
import { OVERDUE_LABEL, TICKET_STATUS_TONES } from "@/constants/ticket";
import { ticketStatusLabels } from "@/domain/ticket";
import type { ConsoleTicketItemProps } from "@/models/console";

const ICON_SIZE = 16;

interface TicketRowProps {
  readonly item: ConsoleTicketItemProps;
  readonly onOpen: (number: string) => void;
}

export function TicketRow({ item, onOpen }: TicketRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item.number)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-xl p-2.5 text-left transition hover:bg-desk focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-data font-semibold text-ink-2">{item.number}</span>
            <Badge.Root tone={TICKET_STATUS_TONES[item.status]}>
              {ticketStatusLabels[item.status]}
            </Badge.Root>
            {item.overdue && <Badge.Root tone="danger">{OVERDUE_LABEL}</Badge.Root>}
          </span>
          <span className="truncate text-sm font-semibold text-ink">{item.title}</span>
          <span className="truncate text-xs text-ink-3">
            {item.lastEvent?.text ?? NO_EVENT_LABEL}
          </span>
        </span>
        <ChevronRight size={ICON_SIZE} aria-hidden="true" className="shrink-0 text-ink-3" />
      </button>
    </li>
  );
}
