import { describe, expect, it } from "vitest";
import { respondWith, toErrorResponse } from "../../src/app/api/error-response";
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
} from "../../src/domain/errors";

describe("toErrorResponse", () => {
  it.each([
    {
      error: new SessionMessageLimitReachedError(30),
      status: 429,
      code: "session_message_limit_reached",
    },
    { error: new ModelRateLimitedError(null), status: 429, code: "model_rate_limited" },
    { error: new ModelUnavailableError(), status: 503, code: "model_unavailable" },
    { error: new TriageOutputInvalidError(), status: 502, code: "triage_output_invalid" },
    { error: new MissingEmployeeContextError(), status: 401, code: "missing_employee_context" },
    { error: new ConversationClosedError("c-1"), status: 409, code: "conversation_closed" },
    { error: new UnauthenticatedError(), status: 401, code: "unauthenticated" },
    { error: new AnalystRequiredError(), status: 403, code: "analyst_required" },
    { error: new DraftNotFoundError("D-1"), status: 404, code: "draft_not_found" },
    { error: new DraftNotPendingError("D-1", "confirmed"), status: 409, code: "draft_not_pending" },
    { error: new DraftPayloadInvalidError("D-1"), status: 422, code: "draft_payload_invalid" },
    { error: new DraftModeChangeError("D-1"), status: 422, code: "draft_mode_change" },
    { error: new TicketNotFoundError("INC-1"), status: 404, code: "ticket_not_found" },
    { error: new TicketClosedError("INC-1"), status: 409, code: "ticket_closed" },
    {
      error: new TicketNotReopenableError("INC-1", "window_expired"),
      status: 409,
      code: "ticket_not_reopenable",
    },
    { error: new ConversationNotFoundError("c-1"), status: 404, code: "conversation_not_found" },
    { error: new LegacyUnavailableError(), status: 503, code: "legacy_unavailable" },
    { error: new UnknownEmployeeError(), status: 401, code: "unknown_employee" },
  ])("maps $code to $status", async ({ error, status, code }) => {
    const response = toErrorResponse(error);

    expect(response?.status).toBe(status);
    expect(await response?.json()).toEqual({ error: error.message, code });
  });

  it("sends Retry-After when the model reports a wait time", () => {
    const response = toErrorResponse(new ModelRateLimitedError(12));

    expect(response?.headers.get("Retry-After")).toBe("12");
  });

  it("leaves unknown errors to the caller", () => {
    expect(toErrorResponse(new Error("boom"))).toBeNull();
    expect(toErrorResponse("boom")).toBeNull();
  });
});

describe("respondWith", () => {
  it("returns the response of the action", async () => {
    const response = await respondWith(() => Promise.resolve(new Response("ok")));

    expect(await response.text()).toBe("ok");
  });

  it("turns a known error into its HTTP response", async () => {
    const response = await respondWith(() => Promise.reject(new UnauthenticatedError()));

    expect(response.status).toBe(401);
  });

  it("lets an unknown error through", async () => {
    await expect(respondWith(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
  });
});
