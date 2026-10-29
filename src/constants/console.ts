import type { AnalystAvailability, ConsoleFilter } from "@/domain/console";
import type { ConversationMode } from "@/domain/conversation";
import type { ConsoleCountsProps, ConsoleLabelViewProps } from "@/models/console";

export const CONSOLE_ENDPOINT = "/api/console/conversations";
export const AVAILABILITY_ENDPOINT = "/api/console/availability";
export const SEARCH_DEBOUNCE_MS = 300;
export const REFRESH_THROTTLE_MS = 300;
export const DISPLAY_TIME_ZONE = "America/Sao_Paulo";

export const CONSOLE_TITLE = "Conversas";
export const SEARCH_PLACEHOLDER = "Pesquisar conversa ou chamado";
export const LIST_LOAD_ERROR = "Não foi possível carregar as conversas agora.";
export const AVAILABILITY_ERROR = "Não foi possível alterar a disponibilidade agora.";
export const EMPTY_LIST_TITLE = "Nenhuma conversa encontrada";
export const EMPTY_LIST_SEARCH_HINT = "Tente outro nome, número de chamado ou trecho da mensagem.";
export const EMPTY_LIST_FILTER_HINT = "Não há conversas neste filtro agora.";
export const EMPTY_PANE_TITLE = "Selecione uma conversa";
export const EMPTY_PANE_HINT = "Escolha uma conversa da lista para ver os detalhes.";
export const NO_MESSAGES_LABEL = "Sem mensagens";

export const FILTER_LABELS = {
  all: "Todas",
  for_you: "Para você",
  with_agent: "Com o agent",
  mine: "Minhas",
} as const satisfies Record<ConsoleFilter, string>;

export const FILTER_COUNT_KEYS = {
  all: "all",
  for_you: "forYou",
  with_agent: "withAgent",
  mine: "mine",
} as const satisfies Record<ConsoleFilter, keyof ConsoleCountsProps>;

export const AVAILABILITY_LABELS = {
  online: "Disponível",
  offline: "Ausente",
} as const satisfies Record<AnalystAvailability, string>;

export const NEXT_AVAILABILITY = {
  online: "offline",
  offline: "online",
} as const satisfies Record<AnalystAvailability, AnalystAvailability>;

export const conversationPathOf = (id: string): string => `${CONSOLE_ENDPOINT}/${id}`;
export const CONVERSATION_LOAD_ERROR = "Não foi possível carregar a conversa agora.";
export const ACTION_ERROR = "Não foi possível concluir a ação agora.";
export const REPLY_PLACEHOLDER = "Escreva a resposta ao funcionário";
export const LOCKED_REPLY_PLACEHOLDER = "Assuma o atendimento para responder";
export const AGENT_BADGE_LABEL = "IA";
export const AGENT_AUTHOR_LABEL = "Nexo Assist";
export const EMPLOYEE_AUTHOR_FALLBACK = "Funcionário";
export const ASSUME_LABEL = "Assumir atendimento";
export const RETURN_LABEL = "Devolver ao agent";
export const CLOSE_LABEL = "Encerrar atendimento";
export const CONFIRM_CLOSE_LABEL = "Confirmar encerramento";
export const CANCEL_LABEL = "Cancelar";
export const OPEN_TICKET_WARNING =
  "O chamado ainda está aberto. Encerrar a conversa não o resolve.";
export const ASSUMED_BY_OTHER_LABEL = "Esta conversa está com outro analista.";
export const AGENT_ACTIVE_LABEL = "O agent está atendendo esta conversa.";
export const CLOSED_LABEL = "Atendimento encerrado.";

export const MODE_BADGE_LABELS = {
  agent: "Agent atendendo",
  awaiting_analyst: "Aguardando atendente",
  with_analyst: "Em atendimento",
  closed: "Encerrada",
} as const satisfies Record<ConversationMode, string>;

export const MODE_BADGE_TONES = {
  agent: "neutral",
  awaiting_analyst: "warning",
  with_analyst: "info",
  closed: "neutral",
} as const satisfies Record<ConversationMode, ConsoleLabelViewProps["tone"]>;

export const conversationHrefOf = (id: string): string => `/console/${id}`;
