import type { MastraModelConfig } from "@mastra/core/llm";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

export interface MockTokenUsage {
  readonly input: number;
  readonly output: number;
}

export interface MockModel {
  readonly model: MastraModelConfig;
  readonly callCount: () => number;
}

const DEFAULT_USAGE: MockTokenUsage = { input: 10, output: 5 };
const NO_TOKENS = 0;

const buildUsage = ({ input, output }: MockTokenUsage) => ({
  inputTokens: { total: input, noCache: input, cacheRead: NO_TOKENS, cacheWrite: NO_TOKENS },
  outputTokens: { total: output, text: output, reasoning: NO_TOKENS },
});

const toMastraModel = (model: MockLanguageModelV4): MastraModelConfig =>
  model as unknown as MastraModelConfig;

export const createMockTextModel = (
  text: string,
  usage: MockTokenUsage = DEFAULT_USAGE,
): MockModel => {
  const mock = new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: buildUsage(usage),
      warnings: [],
    },
  });

  return { model: toMastraModel(mock), callCount: () => mock.doGenerateCalls.length };
};

export const createMockObjectModel = (
  value: unknown,
  usage: MockTokenUsage = DEFAULT_USAGE,
): MockModel => createMockTextModel(JSON.stringify(value), usage);

export const createFailingModel = (error: Error): MockModel => {
  const mock = new MockLanguageModelV4({
    doGenerate: () => {
      throw error;
    },
  });

  return { model: toMastraModel(mock), callCount: () => mock.doGenerateCalls.length };
};

export const createMockStreamModel = (
  text: string,
  usage: MockTokenUsage = DEFAULT_USAGE,
): MockModel => {
  const textId = "text-1";
  const mock = new MockLanguageModelV4({
    doStream: {
      stream: simulateReadableStream({
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: textId },
          { type: "text-delta", id: textId, delta: text },
          { type: "text-end", id: textId },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "stop" },
            usage: buildUsage(usage),
          },
        ],
      }),
    },
  });

  return { model: toMastraModel(mock), callCount: () => mock.doStreamCalls.length };
};
