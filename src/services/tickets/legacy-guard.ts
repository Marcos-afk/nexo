import { LegacyTransientError, LegacyUnavailableError } from "../../domain/errors";
import type { Clock } from "../../lib/clock";
import type { Logger } from "../../lib/logger";
import { retry, sleep } from "../../lib/retry";

export interface LegacyGuard {
  readonly run: <T>(operation: () => Promise<T>) => Promise<T>;
}

export interface OutageSimulator {
  readonly startFor: (durationMs: number) => void;
  readonly assertUp: () => void;
  readonly isDown: () => boolean;
}

export interface LegacyGuardOptions {
  readonly outage: OutageSimulator;
  readonly attempts?: number;
  readonly baseDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly logger?: Logger;
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 200;

export const passthroughGuard: LegacyGuard = { run: (operation) => operation() };

export const createOutageSimulator = (clock: Clock): OutageSimulator => {
  const state = { downUntilMs: 0 };

  return {
    startFor: (durationMs) => {
      state.downUntilMs = clock.now().getTime() + durationMs;
    },
    isDown: () => clock.now().getTime() < state.downUntilMs,
    assertUp: () => {
      if (clock.now().getTime() < state.downUntilMs) {
        throw new LegacyTransientError();
      }
    },
  };
};

export const createLegacyGuard = ({
  outage,
  attempts = DEFAULT_ATTEMPTS,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  sleep: wait = sleep,
  logger,
}: LegacyGuardOptions): LegacyGuard => ({
  run: async (operation) => {
    try {
      return await retry(
        async () => {
          outage.assertUp();

          return operation();
        },
        {
          attempts,
          baseDelayMs,
          sleep: wait,
          isRetryable: (error) => error instanceof LegacyTransientError,
          onRetry: ({ attempt, delayMs }) =>
            logger?.warn({ attempt, delayMs }, "legacy ticket system unavailable, retrying"),
        },
      );
    } catch (error) {
      if (error instanceof LegacyTransientError) {
        throw new LegacyUnavailableError({ cause: error });
      }

      throw error;
    }
  },
});
