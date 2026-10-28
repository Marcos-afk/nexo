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
