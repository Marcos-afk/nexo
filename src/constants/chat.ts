import type { ConversationMode, MessageAuthorKind } from "@/domain/conversation";

export const CHAT_ENDPOINT = "/api/chat";
export const HANDOFF_ENDPOINT = "/api/chat/handoff";
export const CHAT_SESSION_ENDPOINT = "/api/chat/session";
export const EVENTS_ENDPOINT = "/api/events";
export const TYPING_ENDPOINT = "/api/chat/typing";
export const TYPING_SIGNAL_INTERVAL_MS = 2000;
export const SYNC_ERROR = "Não foi possível atualizar a conversa agora.";
export const MESSAGE_LIMIT_WARNING_THRESHOLD = 25;
export const LENGTH_WARNING_THRESHOLD = 1600;

export const CHAT_ACTION_LABELS: Readonly<Record<string, string>> = {
  searchHelpArticles: "buscou na central de ajuda",
  findSimilarTickets: "buscou chamados parecidos",
  listMyTickets: "consultou seus chamados",
  getTicket: "consultou o chamado",
  buildDraft: "montou o rascunho",
  requestHandoff: "pediu um analista",
};

export const AUTHOR_LABELS = {
  employee: "Você",
  agent: "Nexo Assist",
  analyst: "Analista",
  system: "Sistema",
} as const satisfies Record<MessageAuthorKind, string>;

export const MODE_NOTICES = {
  agent: null,
  awaiting_analyst: "Um analista vai atender. O Nexo não responde mais por aqui.",
  with_analyst: "Um analista está atendendo você. O Nexo está em pausa nesta conversa.",
  closed: null,
} as const satisfies Record<ConversationMode, string | null>;

export const EMPTY_CHAT_TITLE = "Como posso ajudar?";
export const EMPTY_CHAT_SUBTITLE =
  "Descreva o problema. O Nexo consulta seus chamados e a central de ajuda, e chama um analista quando precisa.";

export const EMPTY_CHAT_SUGGESTIONS = [
  "Meu notebook não conecta na VPN",
  "Quero abrir um chamado",
  "Quais são meus chamados em aberto?",
  "Como redefino minha senha?",
] as const;

export const CARD_CLASS =
  "w-full rounded-2xl border border-ink/9 bg-paper shadow-[0_1px_2px_#1b24310d,0_6px_18px_#1b24310a]";

export const COMPOSER_PLACEHOLDER = "Escreva para o Nexo…";
export const OFFLINE_PLACEHOLDER = "O assistente está offline no momento";
export const LIMIT_PLACEHOLDER = "Limite de mensagens atingido";

export const OFFLINE_NOTICE =
  "O assistente está offline. Você poderá escrever de novo assim que ele voltar.";
export const DEGRADED_NOTICE =
  "O sistema de chamados está instável. O Nexo ainda orienta, mas pode não conseguir abrir ou consultar chamados agora.";
export const LIMIT_NOTICE =
  "Você atingiu o limite de mensagens desta sessão. Peça ajuda a um analista para continuar.";
export const REQUEST_ANALYST_LABEL = "Falar com um analista";
export const HANDOFF_ERROR = "Não foi possível chamar um analista agora. Tente de novo.";

export const CHAT_ERROR_TITLE = "Não consegui responder agora.";
