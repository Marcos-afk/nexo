import { ModelRateLimitedError, ModelUnavailableError } from "../domain/errors";
import type { ModelState } from "../domain/health";
import type { Clock } from "../lib/clock";
import { classifyModelError } from "../mastra/model-errors";

const MS_PER_MINUTE = 60_000;
const RATE_LIMITED_MEMORY_MINUTES = 5;
const UNAVAILABLE_MEMORY_MINUTES = 1;
const RATE_LIMITED_MEMORY_MS = RATE_LIMITED_MEMORY_MINUTES * MS_PER_MINUTE;
const UNAVAILABLE_MEMORY_MS = UNAVAILABLE_MEMORY_MINUTES * MS_PER_MINUTE;

type FailureState = Exclude<ModelState, "ok">;

const memoryMsByState = {
  rate_limited: RATE_LIMITED_MEMORY_MS,
  unavailable: UNAVAILABLE_MEMORY_MS,
} as const satisfies Record<FailureState, number>;

export interface ModelHealth {
  readonly markOk: () => void;
  readonly markFailure: (error: unknown) => void;
  readonly state: () => ModelState;
}

const failureStateOf = (error: unknown): FailureState | null => {
  if (error instanceof ModelRateLimitedError) {
    return "rate_limited";
  }

  return error instanceof ModelUnavailableError ? "unavailable" : null;
};

export const observeModel = async <T>(
  health: ModelHealth,
  action: () => Promise<T>,
): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    health.markFailure(error);
    throw error;
  }
};

export const createModelHealth = (clock: Clock): ModelHealth => {
  const last: { failure: FailureState | null; at: number } = { failure: null, at: 0 };

  return {
    markOk: () => {
      last.failure = null;
    },
    markFailure: (error) => {
      const failure = failureStateOf(classifyModelError(error) ?? error);

      if (failure !== null) {
        last.failure = failure;
        last.at = clock.now().getTime();
      }
    },
    state: () => {
      if (last.failure === null) {
        return "ok";
      }

      return clock.now().getTime() - last.at <= memoryMsByState[last.failure] ? last.failure : "ok";
    },
  };
};
