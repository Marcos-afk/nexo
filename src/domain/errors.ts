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
