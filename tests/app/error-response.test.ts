import { describe, expect, it } from "vitest";
import { toErrorResponse } from "../../src/app/api/chat/error-response";
import {
  ConversationClosedError,
  MissingEmployeeContextError,
  ModelRateLimitedError,
  ModelUnavailableError,
  SessionMessageLimitReachedError,
  TriageOutputInvalidError,
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
