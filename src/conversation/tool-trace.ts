import { getToolName, isToolUIPart, type UIMessage, type UIMessageChunk } from "ai";
import { summarizeToolOutput, type ToolTraceEntry } from "../domain/tool-trace";

type ToolPart = Parameters<typeof getToolName>[0];

export interface ToolTimer {
  readonly observe: (chunk: UIMessageChunk) => void;
  readonly durations: ReadonlyMap<string, number>;
}

export const createToolTimer = (now: () => number): ToolTimer => {
  const starts = new Map<string, number>();
  const durations = new Map<string, number>();

  const observe = (chunk: UIMessageChunk): void => {
    if (chunk.type === "tool-input-available") {
      starts.set(chunk.toolCallId, now());
    }

    if (chunk.type === "tool-output-available" || chunk.type === "tool-output-error") {
      const startedAt = starts.get(chunk.toolCallId);

      if (startedAt !== undefined) {
        durations.set(chunk.toolCallId, now() - startedAt);
      }
    }
  };

  return { observe, durations };
};

export const withToolTiming = (
  stream: ReadableStream<UIMessageChunk>,
  timer: ToolTimer,
): ReadableStream<UIMessageChunk> =>
  stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform: (chunk, controller) => {
        timer.observe(chunk);
        controller.enqueue(chunk);
      },
    }),
  );

const outcomeOf = (part: ToolPart, name: string) => {
  if (part.state === "output-error") {
    return { summary: part.errorText, failed: true };
  }

  return part.state === "output-available"
    ? summarizeToolOutput(name, part.output)
    : { summary: "Sem resultado", failed: false };
};

const entryOf = (part: ToolPart, durations: ReadonlyMap<string, number>): ToolTraceEntry => {
  const name = getToolName(part);

  return {
    callId: part.toolCallId,
    name,
    input: part.input ?? null,
    ...outcomeOf(part, name),
    durationMs: durations.get(part.toolCallId) ?? null,
  };
};

export const buildToolTrace = (
  reply: UIMessage,
  durations: ReadonlyMap<string, number>,
): ToolTraceEntry[] =>
  reply.parts.flatMap((part) => (isToolUIPart(part) ? [entryOf(part, durations)] : []));
