import {
  ConversationClosedError,
  MissingEmployeeContextError,
  ModelRateLimitedError,
  ModelUnavailableError,
  SessionMessageLimitReachedError,
  TriageOutputInvalidError,
} from "@/domain/errors";

const HTTP_UNAUTHORIZED = 401;
const HTTP_CONFLICT = 409;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SERVICE_UNAVAILABLE = 503;
const RETRY_AFTER_HEADER = "Retry-After";

interface ErrorMapping {
  readonly status: number;
  readonly code: string;
}

const errorMappings = new Map<new (...args: never[]) => Error, ErrorMapping>([
  [
    SessionMessageLimitReachedError,
    { status: HTTP_TOO_MANY_REQUESTS, code: "session_message_limit_reached" },
  ],
  [ModelRateLimitedError, { status: HTTP_TOO_MANY_REQUESTS, code: "model_rate_limited" }],
  [ModelUnavailableError, { status: HTTP_SERVICE_UNAVAILABLE, code: "model_unavailable" }],
  [TriageOutputInvalidError, { status: HTTP_BAD_GATEWAY, code: "triage_output_invalid" }],
  [MissingEmployeeContextError, { status: HTTP_UNAUTHORIZED, code: "missing_employee_context" }],
  [ConversationClosedError, { status: HTTP_CONFLICT, code: "conversation_closed" }],
]);

const retryAfterHeaders = (error: Error): HeadersInit =>
  error instanceof ModelRateLimitedError && error.retryAfterSeconds !== null
    ? { [RETRY_AFTER_HEADER]: String(error.retryAfterSeconds) }
    : {};

export const toErrorResponse = (error: unknown): Response | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  const mapping = [...errorMappings].find(([ErrorClass]) => error instanceof ErrorClass)?.[1];

  return mapping
    ? Response.json(
        { error: error.message, code: mapping.code },
        { status: mapping.status, headers: retryAfterHeaders(error) },
      )
    : null;
};
