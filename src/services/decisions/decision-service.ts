import type { Database } from "../../db/client";
import { decisions } from "../../db/schema";
import type { Triage } from "../../domain/triage";
import type { IdGenerator } from "../../lib/ids";

export type Decision = typeof decisions.$inferSelect;

export interface DecisionServiceDeps {
  readonly database: Database;
  readonly ids: IdGenerator;
}

export interface DecisionRecord {
  readonly messageId: string;
  readonly triage: Triage;
  readonly action: string;
  readonly toolCalls: unknown;
  readonly tokensIn: number | null;
  readonly tokensOut: number | null;
  readonly latencyMs: number | null;
  readonly model: string;
}

export const recordDecision = async (
  { database, ids }: DecisionServiceDeps,
  record: DecisionRecord,
): Promise<Decision> => {
  const decision: Decision = {
    id: ids.next(),
    messageId: record.messageId,
    intent: record.triage.intent,
    understood: record.triage.understood,
    action: record.action,
    confidence: record.triage.confidence,
    rationale: record.triage.rationale,
    signals: record.triage.signals,
    toolCalls: record.toolCalls,
    tokensIn: record.tokensIn,
    tokensOut: record.tokensOut,
    latencyMs: record.latencyMs,
    model: record.model,
  };

  await database.insert(decisions).values(decision);

  return decision;
};

export const createDecisionService = (deps: DecisionServiceDeps) => ({
  record: (record: DecisionRecord) => recordDecision(deps, record),
});

export type DecisionService = ReturnType<typeof createDecisionService>;
