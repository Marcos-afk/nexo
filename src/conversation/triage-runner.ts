import { MastraError } from "@mastra/core/error";
import type { UIMessage } from "ai";
import { TriageOutputInvalidError } from "../domain/errors";
import { type Triage, triageSchema } from "../domain/triage";
import type { Clock } from "../lib/clock";
import type { createTriageAgent } from "../mastra/agents/triage-agent";
import { createModelCallOptions } from "../mastra/model-call";
import { toModelError } from "../mastra/model-errors";
import { models, respondingModelOf } from "../mastra/models";
import { extractText } from "../services/conversations/history";

export interface TriageRunnerDeps {
  readonly agent: Pick<ReturnType<typeof createTriageAgent>, "generate">;
  readonly clock: Clock;
  readonly modelId?: string;
}

export interface TriageOutcome {
  readonly triage: Triage;
  readonly tokensIn: number | null;
  readonly tokensOut: number | null;
  readonly latencyMs: number;
  readonly model: string;
}

const INVALID_STRUCTURED_OUTPUT_ID = "STRUCTURED_OUTPUT_SCHEMA_VALIDATION_FAILED";

const isInvalidStructuredOutput = (error: unknown): boolean =>
  error instanceof MastraError && error.id === INVALID_STRUCTURED_OUTPUT_ID;

const toTextOnlyMessages = (history: readonly UIMessage[]): UIMessage[] =>
  history.map(({ id, role, ...message }) => ({
    ...message,
    id,
    role,
    parts: [{ type: "text", text: extractText({ id, role, ...message }) }],
  }));

const generateTriage = async ({ agent }: TriageRunnerDeps, history: readonly UIMessage[]) => {
  try {
    return await agent.generate(toTextOnlyMessages(history), createModelCallOptions());
  } catch (error) {
    throw isInvalidStructuredOutput(error)
      ? new TriageOutputInvalidError({ cause: error })
      : toModelError(error);
  }
};

export const runTriage = async (
  deps: TriageRunnerDeps,
  history: readonly UIMessage[],
): Promise<TriageOutcome> => {
  const startedAt = deps.clock.now().getTime();
  const result = await generateTriage(deps, history);
  const parsed = triageSchema.safeParse(result.object);

  if (!parsed.success) {
    throw new TriageOutputInvalidError({ cause: parsed.error });
  }

  return {
    triage: parsed.data,
    tokensIn: result.usage.inputTokens ?? null,
    tokensOut: result.usage.outputTokens ?? null,
    latencyMs: deps.clock.now().getTime() - startedAt,
    model: deps.modelId ?? respondingModelOf(result.response, models.triage),
  };
};
