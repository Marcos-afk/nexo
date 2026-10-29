import { StreamErrorRetryProcessor } from "@mastra/core/processors";

export const MODEL_STEP_TIMEOUT_MS = 30_000;
export const MODEL_TOTAL_TIMEOUT_MS = 60_000;
export const MODEL_MAX_RETRIES = 0;

const MINIMAL_THINKING_LEVEL = "minimal";

export const createModelCallOptions = () =>
  ({
    modelSettings: {
      maxRetries: MODEL_MAX_RETRIES,
      timeout: { stepMs: MODEL_STEP_TIMEOUT_MS, totalMs: MODEL_TOTAL_TIMEOUT_MS },
    },
    providerOptions: {
      google: { thinkingConfig: { thinkingLevel: MINIMAL_THINKING_LEVEL } },
    },
  }) as const;

export const createErrorProcessors = () => [
  new StreamErrorRetryProcessor({ maxRetries: MODEL_MAX_RETRIES }),
];
