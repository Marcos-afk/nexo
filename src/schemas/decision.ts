import { z } from "zod";
import { triageIntents, triageSignals } from "@/domain/triage";
import type { DecisionResponseProps } from "@/models/decision";

export const decisionResponseSchema = z.object({
  decision: z.object({
    messageId: z.string(),
    intent: z.enum(triageIntents),
    understood: z.string(),
    action: z.string(),
    confidence: z.number(),
    rationale: z.string(),
    signals: z.array(z.enum(triageSignals)),
    toolCalls: z.array(
      z.object({
        callId: z.string(),
        name: z.string(),
        input: z.unknown(),
        summary: z.string().nullable(),
        durationMs: z.number().nullable(),
        failed: z.boolean(),
      }),
    ),
    model: z.string(),
    tokensIn: z.number().nullable(),
    tokensOut: z.number().nullable(),
    latencyMs: z.number().nullable(),
  }),
}) satisfies z.ZodType<DecisionResponseProps>;
