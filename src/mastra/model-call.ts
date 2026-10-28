export const MODEL_CALL_TIMEOUT_MS = 20_000;
export const MODEL_MAX_RETRIES = 0;

const MINIMAL_THINKING_LEVEL = "minimal";

export const createModelCallOptions = () => ({
  abortSignal: AbortSignal.timeout(MODEL_CALL_TIMEOUT_MS),
  maxRetries: MODEL_MAX_RETRIES,
  providerOptions: {
    google: { thinkingConfig: { thinkingLevel: MINIMAL_THINKING_LEVEL } },
  },
});
