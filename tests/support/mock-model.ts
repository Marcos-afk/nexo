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

export const createMockObjectSequenceModel = (
  values: readonly unknown[],
  usage: MockTokenUsage = DEFAULT_USAGE,
): MockModel => {
  const mock = new MockLanguageModelV4({
    doGenerate: values.map((value) => ({
      content: [{ type: "text" as const, text: JSON.stringify(value) }],
      finishReason: { unified: "stop" as const, raw: "stop" },
      usage: buildUsage(usage),
      warnings: [],
    })),
  });

  return { model: toMastraModel(mock), callCount: () => mock.doGenerateCalls.length };
};

export type ScriptedStep =
  | { readonly toolCall: { readonly name: string; readonly input: unknown } }
  | { readonly text: string };

export interface ScriptedModel extends MockModel {
  readonly systemPrompts: () => readonly string[];
}

type MockOptions = NonNullable<ConstructorParameters<typeof MockLanguageModelV4>[0]>;
type StreamResult = Extract<NonNullable<MockOptions["doStream"]>, { stream: unknown }>;
type StreamPart = StreamResult["stream"] extends ReadableStream<infer Part> ? Part : never;

const stopReason = { unified: "stop", raw: "stop" } as const;
const toolCallsReason = { unified: "tool-calls", raw: "tool-calls" } as const;

const stepChunks = (step: ScriptedStep, index: number, usage: MockTokenUsage): StreamPart[] =>
  "toolCall" in step
    ? [
        { type: "stream-start" as const, warnings: [] },
        {
          type: "tool-call" as const,
          toolCallId: `call-${index}`,
          toolName: step.toolCall.name,
          input: JSON.stringify(step.toolCall.input),
        },
        { type: "finish" as const, finishReason: toolCallsReason, usage: buildUsage(usage) },
      ]
    : [
        { type: "stream-start" as const, warnings: [] },
        { type: "text-start" as const, id: `text-${index}` },
        { type: "text-delta" as const, id: `text-${index}`, delta: step.text },
        { type: "text-end" as const, id: `text-${index}` },
        { type: "finish" as const, finishReason: stopReason, usage: buildUsage(usage) },
      ];

const systemPromptOf = (call: { prompt: readonly { role: string; content: unknown }[] }): string =>
  call.prompt
    .filter((message) => message.role === "system")
    .map((message) => String(message.content))
    .join("\n");

export const createScriptedStreamModel = (
  steps: readonly ScriptedStep[],
  usage: MockTokenUsage = DEFAULT_USAGE,
): ScriptedModel => {
  const mock = new MockLanguageModelV4({
    doStream: steps.map((step, index) => ({
      stream: simulateReadableStream({ chunks: stepChunks(step, index, usage) }),
    })),
  });

  return {
    model: toMastraModel(mock),
    callCount: () => mock.doStreamCalls.length,
    systemPrompts: () => mock.doStreamCalls.map(systemPromptOf),
  };
};
