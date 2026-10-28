import { z } from "zod";

export const triageIntents = [
  "how_to",
  "ticket_lookup",
  "ticket_create",
  "human_request",
  "out_of_scope",
  "chitchat",
  "unclear",
] as const;

export const triageSignals = [
  "asks_for_human",
  "urgent",
  "ambiguous",
  "missing_details",
  "mentions_ticket_number",
  "non_it_topic",
] as const;

export const MIN_CONFIDENCE = 0;
export const MAX_CONFIDENCE = 100;

export const triageSchema = z.object({
  intent: z.enum(triageIntents),
  understood: z.string().min(1),
  confidence: z.number().int().min(MIN_CONFIDENCE).max(MAX_CONFIDENCE),
  rationale: z.string().min(1),
  signals: z.array(z.enum(triageSignals)),
});

export type TriageIntent = (typeof triageIntents)[number];
export type TriageSignal = (typeof triageSignals)[number];
export type Triage = z.infer<typeof triageSchema>;
