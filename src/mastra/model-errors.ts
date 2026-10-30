import { APICallError } from "ai";
import { ModelRateLimitedError, ModelUnavailableError } from "../domain/errors";

const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR_FLOOR = 500;
const HTTP_NOT_FOUND = 404;
const HTTP_REQUEST_TIMEOUT = 408;
const UNAVAILABLE_STATUS_CODES: ReadonlySet<number> = new Set([
  HTTP_NOT_FOUND,
  HTTP_REQUEST_TIMEOUT,
]);
const MAX_CAUSE_DEPTH = 5;
const MISSING_API_KEY_PATTERN = /could not find api key/i;
const RETRY_AFTER_HEADER = "retry-after";
const RETRY_IN_PATTERN = /retry in (?:(\d+)h)?(?:(\d+)m)?([\d.]+)s/i;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const TIMEOUT_ERROR_NAMES: ReadonlySet<string> = new Set([
  "TimeoutError",
  "AbortError",
  "MastraTimeoutError",
]);

export type ModelFailure = ModelRateLimitedError | ModelUnavailableError;

const causeChainOf = (error: unknown): readonly unknown[] => {
  const chain = Array.from({ length: MAX_CAUSE_DEPTH }).reduce<readonly unknown[]>(
    (collected) => {
      const last = collected.at(-1);

      return last instanceof Error && last.cause !== undefined
        ? [...collected, last.cause]
        : collected;
    },
    [error],
  );

  return chain;
};

const parseSeconds = (value: string | undefined): number | null => {
  const seconds = value === undefined ? Number.NaN : Number(value);

  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
};

const parseRetryInText = (text: string): number | null => {
  const [, hours, minutes, seconds] = RETRY_IN_PATTERN.exec(text) ?? [];

  return parseSeconds(
    seconds === undefined
      ? undefined
      : String(
          Number(hours ?? 0) * SECONDS_PER_HOUR +
            Number(minutes ?? 0) * SECONDS_PER_MINUTE +
            Number(seconds),
        ),
  );
};

const retryAfterSecondsOf = (error: APICallError): number | null =>
  parseSeconds(error.responseHeaders?.[RETRY_AFTER_HEADER]) ??
  parseRetryInText(error.responseBody ?? error.message);

const isUnavailableStatus = (statusCode: number | undefined): boolean =>
  statusCode !== undefined &&
  (statusCode >= HTTP_SERVER_ERROR_FLOOR || UNAVAILABLE_STATUS_CODES.has(statusCode));

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && TIMEOUT_ERROR_NAMES.has(error.name);

const isMissingApiKey = (error: unknown): boolean =>
  error instanceof Error && MISSING_API_KEY_PATTERN.test(error.message);

const classifySingle = (error: unknown): ModelFailure | null => {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === HTTP_TOO_MANY_REQUESTS) {
      return new ModelRateLimitedError(retryAfterSecondsOf(error), { cause: error });
    }

    return isUnavailableStatus(error.statusCode)
      ? new ModelUnavailableError({ cause: error })
      : null;
  }

  return isTimeout(error) || isMissingApiKey(error)
    ? new ModelUnavailableError({ cause: error })
    : null;
};

export const classifyModelError = (error: unknown): ModelFailure | null =>
  causeChainOf(error)
    .map(classifySingle)
    .find((failure) => failure !== null) ?? null;

export const toModelError = (error: unknown): unknown => classifyModelError(error) ?? error;
