import { z } from "zod";

const REQUEST_TIMEOUT_MS = 10_000;
const NETWORK_ERROR_STATUS = 0;
const GENERIC_API_ERROR = "Não foi possível concluir a operação. Tente novamente em instantes.";

export class ApiError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiRequestOptions<T> {
  readonly schema: z.ZodType<T>;
  readonly body: unknown;
}

const errorBodySchema = z.object({ error: z.string() });

const failureMessageOf = async (response: Response): Promise<string> => {
  const body = errorBodySchema.safeParse(await response.json().catch(() => null));

  return body.success ? body.data.error : GENERIC_API_ERROR;
};

const send = (path: string, options: ApiRequestOptions<unknown>) =>
  fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options.body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  }).catch((cause: unknown) => {
    throw new ApiError(NETWORK_ERROR_STATUS, GENERIC_API_ERROR, { cause });
  });

const post = async <T>(path: string, options: ApiRequestOptions<T>): Promise<T> => {
  const response = await send(path, options);

  if (!response.ok) {
    throw new ApiError(response.status, await failureMessageOf(response));
  }

  const body = options.schema.safeParse(await response.json().catch(() => null));

  if (!body.success) {
    throw new ApiError(response.status, GENERIC_API_ERROR, { cause: body.error });
  }

  return body.data;
};

export const api = {
  post: <T>(path: string, body: unknown, schema: z.ZodType<T>) => post(path, { body, schema }),
};
