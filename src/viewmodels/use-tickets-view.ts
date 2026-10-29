import { useState } from "react";
import type { TicketStatus } from "@/domain/ticket";
import type { TicketsViewType } from "@/models/console";

const OVERVIEW: TicketsViewType = { kind: "overview" };

export function useTicketsView() {
  const [view, setView] = useState<TicketsViewType>(OVERVIEW);
  const [status, setStatus] = useState<TicketStatus | "all">("all");

  const goBack = () =>
    setView((current) => (current.kind === "detail" ? { kind: current.from } : OVERVIEW));

  return {
    view,
    status,
    onStatusChange: setStatus,
    onShowAll: () => setView({ kind: "all" }),
    onBack: goBack,
    onOpenTicket: (number: string) =>
      setView((current) => ({
        kind: "detail",
        number,
        from: current.kind === "all" ? "all" : "overview",
      })),
  };
}
