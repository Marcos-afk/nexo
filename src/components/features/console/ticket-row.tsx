import { cx } from "class-variance-authority";
import { ArrowRightLeft, ChevronRight } from "lucide-react";
import { NO_EVENT_LABEL } from "@/constants/console";
import {
  PRIORITY_LABELS,
  TICKET_STATUS_TONES,
  TONE_DOT_CLASSES,
  TONE_TEXT_CLASSES,
} from "@/constants/ticket";
import { ticketStatusLabels } from "@/domain/ticket";
import type { ConsoleTicketItemProps } from "@/models/console";
import { clockTimeOf } from "@/utils/console-format";

const ICON_SIZE = 16;
const EVENT_ICON_SIZE = 15;

interface TicketRowProps {
  readonly item: ConsoleTicketItemProps;
  readonly onOpen: (number: string) => void;
}

export function CurrentTicketCard({ item, onOpen }: TicketRowProps) {
  const tone = TICKET_STATUS_TONES[item.status];

  return (
    <button
      type="button"
      onClick={() => onOpen(item.number)}
      className="flex w-full cursor-pointer flex-col gap-3.5 rounded-xl bg-desk p-4 text-left transition hover:bg-card focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span className="flex flex-col gap-1.5">
        <span className="flex items-center text-xs">
          <span className="min-w-0 flex-1 font-medium text-ink-3">{item.number}</span>
          <span className={cx("flex items-center gap-1.5 font-semibold", TONE_TEXT_CLASSES[tone])}>
            <span
              aria-hidden="true"
              className={cx("size-1.75 rounded-full", TONE_DOT_CLASSES[tone])}
            />
            {ticketStatusLabels[item.status]}
          </span>
        </span>
        <span className="text-[15.5px] leading-[1.3] font-semibold text-ink">{item.title}</span>
        <span className="text-sm text-ink-3">
          prioridade {PRIORITY_LABELS[item.priority].toLowerCase()}
        </span>
      </span>
      <span className="flex items-center gap-2 border-t border-rule pt-3 text-sm text-ink-2">
        <ArrowRightLeft size={EVENT_ICON_SIZE} aria-hidden="true" className="shrink-0 text-ink-3" />
        <span className="min-w-0 flex-1 truncate">{item.lastEvent?.text ?? NO_EVENT_LABEL}</span>
        {item.lastEvent && (
          <span className="text-xs text-ink-3">{clockTimeOf(item.lastEvent.at)}</span>
        )}
      </span>
    </button>
  );
}

export function TicketRow({ item, onOpen }: TicketRowProps) {
  const tone = TICKET_STATUS_TONES[item.status];

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item.number)}
        className="flex w-full cursor-pointer items-center gap-3 border-b border-rule py-3 text-left transition hover:bg-desk focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span
          aria-hidden="true"
          className={cx("size-1.75 shrink-0 rounded-full", TONE_DOT_CLASSES[tone])}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.75">
          <span className="truncate text-[14.5px] font-medium text-ink">{item.title}</span>
          <span className="truncate text-xs text-ink-3">
            {item.number} · {item.lastEvent?.text ?? ticketStatusLabels[item.status]}
          </span>
        </span>
        <ChevronRight size={ICON_SIZE} aria-hidden="true" className="shrink-0 text-ink-3" />
      </button>
    </li>
  );
}
