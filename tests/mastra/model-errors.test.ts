import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import { ModelRateLimitedError, ModelUnavailableError } from "../../src/domain/errors";
import { classifyModelError, toModelError } from "../../src/mastra/model-errors";

const apiError = (
  statusCode: number | undefined,
  extra: { readonly responseBody?: string; readonly responseHeaders?: Record<string, string> } = {},
) =>
  new APICallError({
    message: "falha",
    url: "https://example.test",
    requestBodyValues: {},
    ...(statusCode === undefined ? {} : { statusCode }),
    ...extra,
  });

const named = (name: string): Error => Object.assign(new Error("tempo esgotado"), { name });

describe("classifyModelError: rate limit", () => {
  it.each([
    {
      name: "the Retry-After header",
      error: apiError(429, { responseHeaders: { "retry-after": "12" } }),
      seconds: 12,
    },
    {
      name: "the 'retry in' text",
      error: apiError(429, { responseBody: "Please retry in 11.2s." }),
      seconds: 12,
    },
    {
      name: "minutes and seconds in the text",
      error: apiError(429, { responseBody: "Please retry in 2m5.4s." }),
      seconds: 126,
    },
    {
      name: "hours, minutes and seconds in the text",
      error: apiError(429, { responseBody: "Please retry in 4h53m26.098059947s." }),
      seconds: 17607,
    },
    { name: "nothing to read", error: apiError(429), seconds: null },
  ])("maps a 429 with $name", ({ error, seconds }) => {
    const failure = classifyModelError(error);

    expect(failure).toBeInstanceOf(ModelRateLimitedError);
    expect(failure).toMatchObject({ retryAfterSeconds: seconds });
  });
});

describe("classifyModelError: unavailable", () => {
  it.each([
    { name: "a 503", error: apiError(503) },
    { name: "a 500", error: apiError(500) },
    { name: "a 404 (model removed)", error: apiError(404) },
    { name: "a 408", error: apiError(408) },
    { name: "a timeout", error: named("TimeoutError") },
    { name: "an abort", error: named("AbortError") },
    { name: "a Mastra step timeout", error: named("MastraTimeoutError") },
  ])("maps $name", ({ error }) => {
    expect(classifyModelError(error)).toBeInstanceOf(ModelUnavailableError);
  });
});

describe("classifyModelError: other errors", () => {
  it.each([
    { name: "a 400", error: apiError(400) },
    { name: "an API error without status", error: apiError(undefined) },
    { name: "a plain error", error: new Error("bug") },
    { name: "a non-error value", error: "texto" },
  ])("does not classify $name", ({ error }) => {
    expect(classifyModelError(error)).toBeNull();
    expect(toModelError(error)).toBe(error);
  });

  it("finds the failure inside the cause chain", () => {
    const wrapped = new Error("falha do agent", {
      cause: new Error("outra", { cause: apiError(429) }),
    });

    expect(classifyModelError(wrapped)).toBeInstanceOf(ModelRateLimitedError);
  });
});
