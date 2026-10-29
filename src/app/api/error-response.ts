import {
  AnalystRequiredError,
  ConversationClosedError,
  ConversationNotFoundError,
  DraftModeChangeError,
  DraftNotFoundError,
  DraftNotPendingError,
  DraftPayloadInvalidError,
  LegacyUnavailableError,
  MissingEmployeeContextError,
  ModelRateLimitedError,
  ModelUnavailableError,
  SessionMessageLimitReachedError,
  TicketClosedError,
  TicketNotFoundError,
  TicketNotReopenableError,
  TriageOutputInvalidError,
  UnauthenticatedError,
  UnknownEmployeeError,
} from "@/domain/errors";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_UNPROCESSABLE = 422;
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
  [UnauthenticatedError, { status: HTTP_UNAUTHORIZED, code: "unauthenticated" }],
  [AnalystRequiredError, { status: HTTP_FORBIDDEN, code: "analyst_required" }],
  [DraftNotFoundError, { status: HTTP_NOT_FOUND, code: "draft_not_found" }],
  [DraftNotPendingError, { status: HTTP_CONFLICT, code: "draft_not_pending" }],
  [DraftPayloadInvalidError, { status: HTTP_UNPROCESSABLE, code: "draft_payload_invalid" }],
  [DraftModeChangeError, { status: HTTP_UNPROCESSABLE, code: "draft_mode_change" }],
  [TicketNotFoundError, { status: HTTP_NOT_FOUND, code: "ticket_not_found" }],
  [TicketClosedError, { status: HTTP_CONFLICT, code: "ticket_closed" }],
  [TicketNotReopenableError, { status: HTTP_CONFLICT, code: "ticket_not_reopenable" }],
  [ConversationNotFoundError, { status: HTTP_NOT_FOUND, code: "conversation_not_found" }],
  [LegacyUnavailableError, { status: HTTP_SERVICE_UNAVAILABLE, code: "legacy_unavailable" }],
  [UnknownEmployeeError, { status: HTTP_UNAUTHORIZED, code: "unknown_employee" }],
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

export const respondWith = async (action: () => Promise<Response>): Promise<Response> => {
  try {
    return await action();
  } catch (error) {
    const response = toErrorResponse(error);

    if (response) {
      return response;
    }

    throw error;
  }
};
