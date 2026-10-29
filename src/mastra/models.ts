import type { MastraModelConfig } from "@mastra/core/llm";
import { z } from "zod";
import { MODEL_MAX_RETRIES } from "./model-call";

const MODEL_PROVIDER = "google";

export const modelChains = {
  triage: [
    "google/gemini-3.5-flash-lite",
    "google/gemini-3.1-flash-lite",
    "google/gemini-3.5-flash",
  ],
  support: ["google/gemini-3.6-flash", "google/gemini-3.5-flash", "google/gemini-3.5-flash-lite"],
} as const;

export const models = {
  triage: modelChains.triage[0],
  support: modelChains.support[0],
} as const;

export interface ModelChainEntry {
  model: MastraModelConfig;
  maxRetries: number;
}

export type ModelSelection = MastraModelConfig | ModelChainEntry[];

export const createModelChain = (candidates: readonly MastraModelConfig[]): ModelChainEntry[] =>
  candidates.map((model) => ({ model, maxRetries: MODEL_MAX_RETRIES }));

const responseModelSchema = z.object({ modelMetadata: z.object({ modelId: z.string().min(1) }) });

export const qualifyModelId = (modelId: string | undefined, fallback: string): string => {
  if (modelId === undefined) {
    return fallback;
  }

  return modelId.includes("/") ? modelId : `${MODEL_PROVIDER}/${modelId}`;
};

export const respondingModelOf = (response: unknown, fallback: string): string => {
  const parsed = responseModelSchema.safeParse(response);

  return qualifyModelId(parsed.success ? parsed.data.modelMetadata.modelId : undefined, fallback);
};
