import { z } from "zod";

const REQUEST_TIMEOUT_MS = 10_000;
const NETWORK_ERROR_STATUS = 0;
const HTTP_NO_CONTENT = 204;
const GENERIC_API_ERROR = "Não foi possível concluir a operação. Tente novamente em instantes.";

type HttpMethodType = "GET" | "POST";

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
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

const errorBodySchema = z.object({ error: z.string() });

const signalOf = (signal: AbortSignal | undefined): AbortSignal =>
  signal
    ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
    : AbortSignal.timeout(REQUEST_TIMEOUT_MS);

const failureMessageOf = async (response: Response): Promise<string> => {
  const body = errorBodySchema.safeParse(await response.json().catch(() => null));

  return body.success ? body.data.error : GENERIC_API_ERROR;
};

export const apiErrorOf = async (response: Response): Promise<ApiError> =>
  new ApiError(response.status, await failureMessageOf(response));

const send = (method: HttpMethodType, path: string, options: ApiRequestOptions<unknown>) =>
  fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: options.body === undefined ? null : JSON.stringify(options.body),
    signal: signalOf(options.signal),
  }).catch((cause: unknown) => {
    throw new ApiError(NETWORK_ERROR_STATUS, GENERIC_API_ERROR, { cause });
  });

const request = async <T>(
  method: HttpMethodType,
  path: string,
  options: ApiRequestOptions<T>,
): Promise<T> => {
  const response = await send(method, path, options);

  if (!response.ok) {
    throw await apiErrorOf(response);
  }

  const payload =
    response.status === HTTP_NO_CONTENT ? undefined : await response.json().catch(() => null);
  const body = options.schema.safeParse(payload);

  if (!body.success) {
    throw new ApiError(response.status, GENERIC_API_ERROR, { cause: body.error });
  }

  return body.data;
};

export const api = {
  get: <T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal) =>
    request("GET", path, signal ? { schema, signal } : { schema }),
  post: <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
    request("POST", path, { body, schema }),
};
