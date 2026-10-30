import { cx } from "class-variance-authority";
import { CARD_CLASS } from "@/constants/chat";
import { TONE_DOT_CLASSES } from "@/constants/ticket";
import type { TicketSummaryView } from "@/domain/ticket-view";
import { shortDateOf } from "@/utils/short-date";
import { toneOfTicketStatus } from "@/utils/ticket-status";

const CHOICE_SEPARATOR = " · ";

interface TicketListProps {
  readonly tickets: readonly TicketSummaryView[];
  readonly isDisabled: boolean;
  readonly onSelect: (text: string) => void;
}

export function TicketList({ tickets, isDisabled, onSelect }: TicketListProps) {
  return (
    <ul aria-label="Seus chamados" className={cx(CARD_CLASS, "flex flex-col overflow-hidden")}>
      {tickets.map((ticket) => (
        <li key={ticket.number}>
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(`${ticket.number}${CHOICE_SEPARATOR}${ticket.title}`)}
            className="flex h-11.5 w-full items-center gap-3.5 px-4 text-left transition hover:bg-cta/4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              aria-hidden="true"
              className="size-4 shrink-0 rounded-full border-[1.5px] border-ink/20 bg-paper"
            />
            <span className="text-xs font-medium text-ink-3">{ticket.number}</span>
            <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-ink">
              {ticket.title}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-ink-3">
              <span
                aria-hidden="true"
                className={cx(
                  "size-1.5 rounded-full",
                  TONE_DOT_CLASSES[toneOfTicketStatus(ticket.status)],
                )}
              />
              {ticket.status}
            </span>
            <span className="w-11 text-xs text-ink-3">{shortDateOf(ticket.updatedAt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
