"use client";

import { TICKET_LOAD_ERROR, TICKETS_LOAD_ERROR } from "@/constants/console";
import type { ConversationTicketsProps, TicketsViewType } from "@/models/console";
import { useConversationTickets } from "@/viewmodels/use-conversation-tickets";
import { useTicketDetail } from "@/viewmodels/use-ticket-detail";
import { useTicketsView } from "@/viewmodels/use-tickets-view";
import { TicketDetail } from "./ticket-detail";
import { TicketsAll } from "./tickets-all";
import { TicketsOverview } from "./tickets-overview";
import { TicketsPanelHeader } from "./tickets-panel-header";

interface TicketsPanelProps {
  readonly conversationId: string;
  readonly onClose: () => void;
}

interface PanelBodyProps {
  readonly conversationId: string;
  readonly tickets: ConversationTicketsProps;
  readonly view: TicketsViewType;
  readonly controls: ReturnType<typeof useTicketsView>;
}

function DetailBody({ conversationId, number }: { conversationId: string; number: string }) {
  const state = useTicketDetail(conversationId, number);

  if (state === null) {
    return <p className="px-4 py-6 text-center text-sm text-ink-3">Carregando…</p>;
  }

  return state.detail ? (
    <TicketDetail detail={state.detail} />
  ) : (
    <p role="alert" className="px-4 py-6 text-center text-sm text-danger-text">
      {state.error ?? TICKET_LOAD_ERROR}
    </p>
  );
}

function PanelBody({ conversationId, tickets, view, controls }: PanelBodyProps) {
  if (view.kind === "detail") {
    return <DetailBody key={view.number} conversationId={conversationId} number={view.number} />;
  }

  return view.kind === "all" ? (
    <TicketsAll
      tickets={tickets}
      status={controls.status}
      onStatusChange={controls.onStatusChange}
      onOpen={controls.onOpenTicket}
    />
  ) : (
    <TicketsOverview
      tickets={tickets}
      onOpen={controls.onOpenTicket}
      onShowAll={controls.onShowAll}
    />
  );
}

export function TicketsPanel({ conversationId, onClose }: TicketsPanelProps) {
  const { tickets, hasFailed } = useConversationTickets(conversationId);
  const controls = useTicketsView();

  return (
    <aside
      aria-label="Chamados do funcionário"
      className="flex w-80 shrink-0 flex-col border-l border-rule bg-paper"
    >
      <TicketsPanelHeader
        tickets={tickets}
        canGoBack={controls.view.kind !== "overview"}
        onBack={controls.onBack}
        onClose={onClose}
      />
      {tickets ? (
        <PanelBody
          conversationId={conversationId}
          tickets={tickets}
          view={controls.view}
          controls={controls}
        />
      ) : (
        <p
          role={hasFailed ? "alert" : undefined}
          className="px-4 py-6 text-center text-sm text-ink-3"
        >
          {hasFailed ? TICKETS_LOAD_ERROR : "Carregando…"}
        </p>
      )}
    </aside>
  );
}
