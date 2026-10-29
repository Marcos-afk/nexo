import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import { createModelHealth, observeModel } from "../../src/conversation/model-health";
import { ModelRateLimitedError, ModelUnavailableError } from "../../src/domain/errors";

const MS_PER_SECOND = 1000;
const START_MS = Date.parse("2026-10-28T10:00:00-03:00");

const createMovingClock = () => {
  const time = { nowMs: START_MS };

  return {
    clock: { now: () => new Date(time.nowMs) },
    advanceSeconds: (seconds: number) => {
      time.nowMs += seconds * MS_PER_SECOND;
    },
  };
};

const quotaError = () =>
  new APICallError({
    message: "quota",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode: 429,
  });

describe("createModelHealth", () => {
  it("starts healthy because nothing has failed yet", () => {
    expect(createModelHealth(createMovingClock().clock).state()).toBe("ok");
  });

  it.each([
    {
      name: "a typed rate-limit error",
      error: new ModelRateLimitedError(30),
      expected: "rate_limited",
    },
    {
      name: "a typed unavailable error",
      error: new ModelUnavailableError(),
      expected: "unavailable",
    },
    { name: "a raw 429 from the provider", error: quotaError(), expected: "rate_limited" },
  ])("moves to $expected after $name", ({ error, expected }) => {
    const health = createModelHealth(createMovingClock().clock);

    health.markFailure(error);

    expect(health.state()).toBe(expected);
  });

  it.each([new Error("bug"), "texto", null])(
    "ignores %j, which is not a model failure",
    (error) => {
      const health = createModelHealth(createMovingClock().clock);

      health.markFailure(error);

      expect(health.state()).toBe("ok");
    },
  );

  it("recovers by itself once the memory of an unavailable model expires", () => {
    const { clock, advanceSeconds } = createMovingClock();
    const health = createModelHealth(clock);
    health.markFailure(new ModelUnavailableError());

    advanceSeconds(30);
    const during = health.state();
    advanceSeconds(31);

    expect([during, health.state()]).toEqual(["unavailable", "ok"]);
  });

  it("remembers an exhausted quota longer than a short outage", () => {
    const { clock, advanceSeconds } = createMovingClock();
    const health = createModelHealth(clock);
    health.markFailure(new ModelRateLimitedError(null));

    advanceSeconds(240);
    const during = health.state();
    advanceSeconds(61);

    expect([during, health.state()]).toEqual(["rate_limited", "ok"]);
  });

  it("clears the failure when a turn finishes well", () => {
    const health = createModelHealth(createMovingClock().clock);
    health.markFailure(new ModelUnavailableError());

    health.markOk();

    expect(health.state()).toBe("ok");
  });
});

describe("observeModel", () => {
  it("returns the result untouched when the call works", async () => {
    const health = createModelHealth(createMovingClock().clock);

    expect(await observeModel(health, () => Promise.resolve("resposta"))).toBe("resposta");
    expect(health.state()).toBe("ok");
  });

  it("records the failure and rethrows the same error", async () => {
    const health = createModelHealth(createMovingClock().clock);
    const failure = new ModelUnavailableError();

    await expect(observeModel(health, () => Promise.reject(failure))).rejects.toBe(failure);
    expect(health.state()).toBe("unavailable");
  });
});
