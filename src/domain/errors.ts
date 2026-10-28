export class MissingEmployeeContextError extends Error {
  public constructor(options?: ErrorOptions) {
    super("Não foi possível identificar o funcionário desta conversa.", options);
    this.name = "MissingEmployeeContextError";
  }
}
