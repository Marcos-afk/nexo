import { ArrowLeft, X } from "lucide-react";
import { BACK_LABEL, CLOSE_PANEL_LABEL, ticketCountsOf, ticketsTitleOf } from "@/constants/console";
import type { ConversationTicketsProps } from "@/models/console";

const ICON_SIZE = 16;
const ICON_BUTTON_CLASSES =
  "flex size-7 cursor-pointer items-center justify-center rounded-md text-ink-3 hover:bg-card hover:text-ink";

interface TicketsPanelHeaderProps {
  readonly tickets: ConversationTicketsProps | null;
  readonly canGoBack: boolean;
  readonly onBack: () => void;
  readonly onClose: () => void;
}

export function TicketsPanelHeader({
  tickets,
  canGoBack,
  onBack,
  onClose,
}: TicketsPanelHeaderProps) {
  return (
    <header className="flex items-start gap-2 border-b border-rule px-4 py-3.5">
      {canGoBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={BACK_LABEL}
          className={ICON_BUTTON_CLASSES}
        >
          <ArrowLeft size={ICON_SIZE} aria-hidden="true" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-bold text-ink">
          {tickets ? ticketsTitleOf(tickets.employeeName) : "Chamados"}
        </h2>
        {tickets && (
          <p className="text-xs text-ink-3">{ticketCountsOf(tickets.open, tickets.closed)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={CLOSE_PANEL_LABEL}
        className={ICON_BUTTON_CLASSES}
      >
        <X size={ICON_SIZE} aria-hidden="true" />
      </button>
    </header>
  );
}
