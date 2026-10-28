import { describe, expect, it } from "vitest";
import { retry } from "../../src/lib/retry";

class TransientError extends Error {}

const BASE_DELAY_MS = 100;

interface RetryCase {
  readonly name: string;
  readonly failures: readonly Error[];
  readonly attempts: number;
  readonly outcome: "resolves" | "rejects";
  readonly delays: readonly number[];
}

const transient = () => new TransientError("transient");

const retryCases: readonly RetryCase[] = [
  { name: "succeeds at once", failures: [], attempts: 3, outcome: "resolves", delays: [] },
  {
    name: "recovers after two failures with growing delays",
    failures: [transient(), transient()],
    attempts: 3,
    outcome: "resolves",
    delays: [100, 200],
  },
  {
    name: "gives up when attempts run out",
    failures: [transient(), transient(), transient()],
    attempts: 3,
    outcome: "rejects",
    delays: [100, 200],
  },
  {
    name: "does not retry a non-retryable error",
    failures: [new Error("fatal")],
    attempts: 3,
    outcome: "rejects",
    delays: [],
  },
];

describe("retry", () => {
  it.each(retryCases)("$name", async ({ failures, attempts, outcome, delays }) => {
    const pending = [...failures];
    const waited: number[] = [];
    const result = retry(
      async () => {
        const failure = pending.shift();

        if (failure) {
          throw failure;
        }

        return "ok";
      },
      {
        attempts,
        baseDelayMs: BASE_DELAY_MS,
        isRetryable: (error) => error instanceof TransientError,
        sleep: async (ms) => {
          waited.push(ms);
        },
      },
    );

    await (outcome === "resolves"
      ? expect(result).resolves.toBe("ok")
      : expect(result).rejects.toBeInstanceOf(Error));
    expect(waited).toEqual(delays);
  });
});
