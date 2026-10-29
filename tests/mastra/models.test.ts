import { describe, expect, it } from "vitest";
import { MODEL_MAX_RETRIES } from "../../src/mastra/model-call";
import {
  createModelChain,
  modelChains,
  models,
  qualifyModelId,
  respondingModelOf,
} from "../../src/mastra/models";

describe("modelChains", () => {
  it.each(Object.entries(modelChains))("%s starts with the primary model", (role, chain) => {
    expect(chain[0]).toBe(models[role as keyof typeof models]);
  });

  it.each(Object.entries(modelChains))(
    "%s has no repeated model and only Google ids",
    (_, chain) => {
      expect(new Set(chain).size).toBe(chain.length);
      expect(chain.every((id) => id.startsWith("google/gemini-"))).toBe(true);
    },
  );

  it("gives triage and support different first models", () => {
    expect(models.triage).not.toBe(models.support);
  });
});

describe("createModelChain", () => {
  it("never retries the same model, so a failure rotates straight to the next", () => {
    const chain = createModelChain(modelChains.support);

    expect(chain.map((entry) => entry.maxRetries)).toEqual([
      MODEL_MAX_RETRIES,
      MODEL_MAX_RETRIES,
      MODEL_MAX_RETRIES,
    ]);
    expect(chain.map((entry) => entry.model)).toEqual([...modelChains.support]);
  });
});

describe("qualifyModelId", () => {
  it.each([
    { name: "a bare model id", modelId: "gemini-3.5-flash", expected: "google/gemini-3.5-flash" },
    {
      name: "an id that already has a provider",
      modelId: "google/gemini-3.6-flash",
      expected: "google/gemini-3.6-flash",
    },
    { name: "a missing id", modelId: undefined, expected: "google/fallback-model" },
  ])("handles $name", ({ modelId, expected }) => {
    expect(qualifyModelId(modelId, "google/fallback-model")).toBe(expected);
  });
});

describe("respondingModelOf", () => {
  it.each([
    {
      name: "a model that answered",
      response: { modelMetadata: { modelId: "gemini-3.5-flash" } },
      expected: "google/gemini-3.5-flash",
    },
    { name: "a response without metadata", response: {}, expected: "google/primary" },
    {
      name: "an empty model id",
      response: { modelMetadata: { modelId: "" } },
      expected: "google/primary",
    },
    { name: "something that is not a response", response: null, expected: "google/primary" },
  ])("handles $name", ({ response, expected }) => {
    expect(respondingModelOf(response, "google/primary")).toBe(expected);
  });
});
