import type { ConversationMode, DraftStatus } from "./conversation";
import type { HandoffAction } from "./handoff";

export class MissingEmployeeContextError extends Error {
  public constructor(options?: ErrorOptions) {
    super("Não foi possível identificar o funcionário desta conversa.", options);
    this.name = "MissingEmployeeContextError";
  }
}

export class StoredConversationInvalidError extends Error {
  public constructor(
    public readonly employeeId: string,
    options?: ErrorOptions,
  ) {
    super("A conversa salva está corrompida e não pôde ser carregada.", options);
    this.name = "StoredConversationInvalidError";
  }
}

export class SessionMessageLimitReachedError extends Error {
  public constructor(
    public readonly limit: number,
    options?: ErrorOptions,
  ) {
    super(
      `Você chegou ao limite de ${limit} mensagens desta sessão. Inicie uma nova sessão para continuar.`,
      options,
    );
    this.name = "SessionMessageLimitReachedError";
  }
}

export class ModelRateLimitedError extends Error {
  public constructor(
    public readonly retryAfterSeconds: number | null,
    options?: ErrorOptions,
  ) {
    super(
      retryAfterSeconds === null
        ? "O assistente atingiu o limite de uso por agora. Tente de novo em instantes."
        : `O assistente atingiu o limite de uso por agora. Tente de novo em cerca de ${retryAfterSeconds} segundos.`,
      options,
    );
    this.name = "ModelRateLimitedError";
  }
}

export class ModelUnavailableError extends Error {
  public constructor(options?: ErrorOptions) {
    super("O assistente está indisponível no momento. Tente de novo em instantes.", options);
    this.name = "ModelUnavailableError";
  }
}

export class TriageOutputInvalidError extends Error {
  public constructor(options?: ErrorOptions) {
    super("Não consegui entender a sua mensagem agora. Tente reformulá-la.", options);
    this.name = "TriageOutputInvalidError";
  }
}

export class ArticleConditionsInvalidError extends Error {
  public constructor(
    public readonly articleId: string,
    options?: ErrorOptions,
  ) {
    super(
      `As condições do artigo ${articleId} estão inválidas e ele não pôde ser carregado.`,
      options,
    );
    this.name = "ArticleConditionsInvalidError";
  }
}

export class ConversationNotFoundError extends Error {
  public constructor(
    public readonly conversationId: string,
    options?: ErrorOptions,
  ) {
    super("Não encontrei essa conversa entre as suas conversas.", options);
    this.name = "ConversationNotFoundError";
  }
}

export class ConversationClosedError extends Error {
  public constructor(
    public readonly conversationId: string,
    options?: ErrorOptions,
  ) {
    super("Essa conversa já foi encerrada e não recebe novas mensagens.", options);
    this.name = "ConversationClosedError";
  }
}

export class LegacyTransientError extends Error {
  public constructor(options?: ErrorOptions) {
    super("O sistema de chamados não respondeu.", options);
    this.name = "LegacyTransientError";
  }
}

export class LegacyUnavailableError extends Error {
  public constructor(options?: ErrorOptions) {
    super(
      "O sistema de chamados está indisponível no momento. Nada foi criado ou alterado; tente novamente em instantes.",
      options,
    );
    this.name = "LegacyUnavailableError";
  }
}

export class AnalystRequiredError extends Error {
  public constructor(options?: ErrorOptions) {
    super("Esta ação é exclusiva de analistas do suporte.", options);
    this.name = "AnalystRequiredError";
  }
}

export class InvalidConversationTransitionError extends Error {
  public constructor(
    public readonly conversationId: string,
    public readonly mode: ConversationMode,
    public readonly action: HandoffAction,
    options?: ErrorOptions,
  ) {
    super(`Não é possível "${action}" uma conversa no estado "${mode}".`, options);
    this.name = "InvalidConversationTransitionError";
  }
}

export class ConversationAssignedToOtherError extends Error {
  public constructor(
    public readonly conversationId: string,
    options?: ErrorOptions,
  ) {
    super("Essa conversa está sendo atendida por outro analista.", options);
    this.name = "ConversationAssignedToOtherError";
  }
}

export class DraftNotFoundError extends Error {
  public constructor(
    public readonly draftId: string,
    options?: ErrorOptions,
  ) {
    super(`Não encontrei o rascunho ${draftId} entre os seus rascunhos.`, options);
    this.name = "DraftNotFoundError";
  }
}

export class DraftNotPendingError extends Error {
  public constructor(
    public readonly draftId: string,
    public readonly status: DraftStatus,
    options?: ErrorOptions,
  ) {
    super(`O rascunho ${draftId} não está mais pendente (${status}).`, options);
    this.name = "DraftNotPendingError";
  }
}

export class DraftPayloadInvalidError extends Error {
  public constructor(
    public readonly draftId: string,
    options?: ErrorOptions,
  ) {
    super(`O conteúdo do rascunho ${draftId} está inválido e não pôde ser confirmado.`, options);
    this.name = "DraftPayloadInvalidError";
  }
}

export class TicketNotFoundError extends Error {
  public constructor(
    public readonly ticketNumber: string,
    options?: ErrorOptions,
  ) {
    super(`Não encontrei o chamado ${ticketNumber} entre os seus chamados.`, options);
    this.name = "TicketNotFoundError";
  }
}

export class TicketClosedError extends Error {
  public constructor(
    public readonly ticketNumber: string,
    options?: ErrorOptions,
  ) {
    super(`O chamado ${ticketNumber} já foi resolvido e não pode receber atualizações.`, options);
    this.name = "TicketClosedError";
  }
}

export type TicketReopenFailure = "not_resolved" | "window_expired";

const reopenFailureMessages = {
  not_resolved: "só chamados resolvidos podem ser reabertos",
  window_expired: "o prazo de 7 dias para reabrir já passou",
} as const satisfies Record<TicketReopenFailure, string>;

export class TicketNotReopenableError extends Error {
  public constructor(
    public readonly ticketNumber: string,
    public readonly failure: TicketReopenFailure,
    options?: ErrorOptions,
  ) {
    super(
      `Não é possível reabrir o chamado ${ticketNumber}: ${reopenFailureMessages[failure]}.`,
      options,
    );
    this.name = "TicketNotReopenableError";
  }
}

export class UnknownEmployeeError extends Error {
  public constructor(options?: ErrorOptions) {
    super(
      "Não encontramos esse e-mail entre os funcionários. Confira o endereço e tente de novo.",
      options,
    );
    this.name = "UnknownEmployeeError";
  }
}

export class UnauthenticatedError extends Error {
  public constructor(options?: ErrorOptions) {
    super("Entre com o seu e-mail corporativo para continuar.", options);
    this.name = "UnauthenticatedError";
  }
}

export class InvalidEnvironmentError extends Error {
  public constructor(
    public readonly variables: readonly string[],
    options?: ErrorOptions,
  ) {
    super(`Variáveis de ambiente ausentes ou inválidas: ${variables.join(", ")}.`, options);
    this.name = "InvalidEnvironmentError";
  }
}

export class DraftModeChangeError extends Error {
  public constructor(
    public readonly draftId: string,
    options?: ErrorOptions,
  ) {
    super(
      `O rascunho ${draftId} não pode mudar de tipo. Cancele-o e peça um novo rascunho.`,
      options,
    );
    this.name = "DraftModeChangeError";
  }
}

export class DatabaseResetBlockedError extends Error {
  public constructor(options?: ErrorOptions) {
    super("O reset do banco apaga todos os dados e é bloqueado em produção.", options);
    this.name = "DatabaseResetBlockedError";
  }
}
