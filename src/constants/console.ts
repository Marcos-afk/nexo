import type { AnalystAvailability, ConsoleFilter } from "@/domain/console";
import type { ConsoleCountsProps } from "@/models/console";

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
