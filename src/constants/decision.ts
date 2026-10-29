import type { TriageIntent, TriageSignal } from "@/domain/triage";

export const DECISION_ENDPOINT = "/api/chat/decisions";
export const DECISION_OPEN_LABEL = "Ver decisão";
export const DECISION_CLOSE_LABEL = "Ocultar decisão";
export const DECISION_LOADING_LABEL = "Carregando decisão…";
export const DECISION_EMPTY_LABEL = "Não há decisão registrada para esta resposta.";
export const DECISION_ERROR_LABEL = "Não foi possível carregar a decisão agora.";
export const DECISION_NO_TOOLS_LABEL = "Nenhuma ferramenta usada.";
export const DECISION_UNAVAILABLE_LABEL = "—";

export const INTENT_LABELS = {
  how_to: "Como fazer",
  ticket_lookup: "Consulta de chamado",
  ticket_create: "Abertura de chamado",
  human_request: "Pedido de analista",
  out_of_scope: "Fora do escopo",
  chitchat: "Conversa casual",
  unclear: "Pedido pouco claro",
} as const satisfies Record<TriageIntent, string>;

export const SIGNAL_LABELS = {
  asks_for_human: "pede uma pessoa",
  urgent: "urgente",
  critical_impact: "impacto crítico",
  ambiguous: "ambíguo",
  missing_details: "faltam detalhes",
  mentions_ticket_number: "cita um chamado",
  non_it_topic: "assunto fora da TI",
} as const satisfies Record<TriageSignal, string>;

export const ACTION_LABELS: Readonly<Record<string, string>> = {
  answer: "Respondeu",
  redirect_out_of_scope: "Redirecionou (fora do escopo)",
  "handoff:employee_request": "Transferiu a pedido da pessoa",
  "handoff:critical_incident": "Transferiu por incidente crítico",
  "handoff:low_confidence": "Transferiu por baixa confiança",
  transfer: "Transferiu para um analista",
};

export const TOOL_LABELS: Readonly<Record<string, string>> = {
  searchHelpArticles: "Central de ajuda",
  findSimilarTickets: "Chamados parecidos",
  listMyTickets: "Meus chamados",
  getTicket: "Consulta de chamado",
  buildDraft: "Montagem de rascunho",
  requestHandoff: "Pedido de analista",
  offerChoices: "Opções de resposta",
};
