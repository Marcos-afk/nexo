import type { DraftMode, DraftStatus } from "@/domain/conversation";
import type { TicketPriority } from "@/domain/sla";
import type { TicketStatus } from "@/domain/ticket";
import type { BadgeToneType } from "@/models/ticket";

export const PRIORITY_LABELS = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
} as const satisfies Record<TicketPriority, string>;

export const PRIORITY_TONES = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
} as const satisfies Record<TicketPriority, BadgeToneType>;

export const TICKET_STATUS_TONES = {
  open: "info",
  in_progress: "info",
  awaiting_analyst: "warning",
  in_service: "violet",
  approved: "success",
  resolved: "success",
} as const satisfies Record<TicketStatus, BadgeToneType>;

export const DRAFT_MODE_LABELS = {
  create: "Novo chamado",
  update: "Atualização de chamado",
  reopen: "Reabertura de chamado",
} as const satisfies Record<DraftMode, string>;

export const DRAFT_STATUS_LABELS = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
} as const satisfies Record<DraftStatus, string>;

export const DRAFT_LOAD_ERROR = "Não foi possível carregar o rascunho.";
export const DRAFT_ACTION_ERROR = "Não foi possível concluir a ação. Tente de novo.";
export const OVERDUE_LABEL = "prazo vencido";
