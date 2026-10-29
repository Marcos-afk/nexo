import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { decisions } from "../../src/db/schema";
import type { Triage } from "../../src/domain/triage";
import { createDecisionService } from "../../src/services/decisions/decision-service";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const triage: Triage = {
  intent: "ticket_lookup",
  understood: "Quer ver os chamados.",
  confidence: 92,
  rationale: "Pergunta direta.",
  signals: ["mentions_ticket_number"],
};

const setup = async () => {
  const database = await createSeededDatabase();
  const [message] = await database.query.messages.findMany({ limit: 1 });

  return {
    database,
    messageId: message?.id ?? "",
    service: createDecisionService({ database, ids: createSequentialIds("dec") }),
  };
};

describe("decision service", () => {
  it("stores the triage, the action and the tool calls of a reply", async () => {
    const { database, messageId, service } = await setup();
    const toolCalls = [{ name: "listMyTickets", durationMs: 12 }];

    const decision = await service.record({
      messageId,
      triage,
      action: "answer",
      toolCalls,
      tokensIn: 120,
      tokensOut: 40,
      latencyMs: 800,
      model: "google/gemini-3.6-flash",
    });
    const [stored] = await database.select().from(decisions).where(eq(decisions.id, decision.id));

    expect(stored).toMatchObject({
      intent: "ticket_lookup",
      action: "answer",
      confidence: 92,
      signals: ["mentions_ticket_number"],
      tokensIn: 120,
      toolCalls,
    });
  });

  it("accepts missing token counts", async () => {
    const { messageId, service } = await setup();

    const decision = await service.record({
      messageId,
      triage,
      action: "handoff:low_confidence",
      toolCalls: null,
      tokensIn: null,
      tokensOut: null,
      latencyMs: null,
      model: "google/gemini-3.5-flash-lite",
    });

    expect(decision).toMatchObject({ tokensIn: null, tokensOut: null, latencyMs: null });
  });
});
