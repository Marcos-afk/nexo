import { describe, expect, it } from "vitest";
import {
  createModelCallOptions,
  MODEL_STEP_TIMEOUT_MS,
  MODEL_TOTAL_TIMEOUT_MS,
} from "../../src/mastra/model-call";

describe("createModelCallOptions", () => {
  it("bounds each model call and the whole run separately", () => {
    const { modelSettings } = createModelCallOptions();

    expect(modelSettings.timeout).toEqual({
      stepMs: MODEL_STEP_TIMEOUT_MS,
      totalMs: MODEL_TOTAL_TIMEOUT_MS,
    });
    expect(MODEL_TOTAL_TIMEOUT_MS).toBeGreaterThan(MODEL_STEP_TIMEOUT_MS);
  });

  it("does not use a single abort signal for the whole stream", () => {
    expect(createModelCallOptions()).not.toHaveProperty("abortSignal");
  });
});
