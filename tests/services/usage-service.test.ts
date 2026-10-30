import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { decisions } from "../../src/db/schema";
import { conversationUsage, usageByConversation } from "../../src/services/usage/usage-service";
import { createSeededDatabase } from "../support/database";

const ANA_HANDOFF = "c-ana-handoff";
const ANA_HANDOFF_MESSAGE = "m-c-ana-handoff-2";
const MODEL = "google/gemini-3.5-flash-lite";

const setup = async () => {
  const database = await createSeededDatabase();

  await database
    .update(decisions)
    .set({ tokensIn: 1500, tokensOut: 100, latencyMs: 4000, model: MODEL })
    .where(eq(decisions.messageId, ANA_HANDOFF_MESSAGE));

  return { database };
};

describe("usage service", () => {
  it("sums the measured turns of one conversation", async () => {
    const { database } = await setup();
    const usage = await conversationUsage({ database }, ANA_HANDOFF);

    expect(usage).toMatchObject({
      turns: 1,
      tokensIn: 1500,
      tokensOut: 100,
      totalTokens: 1600,
      averageLatencyMs: 4000,
      maxLatencyMs: 4000,
    });
  });

  it("gives an empty summary to a conversation with no decisions", async () => {
    const { database } = await setup();

    expect((await conversationUsage({ database }, "c-fabio")).turns).toBe(0);
  });

  it("groups every conversation that has decisions, with the employee name", async () => {
    const { database } = await setup();
    const rows = await usageByConversation({ database });
    const ana = rows.find((row) => row.conversationId === ANA_HANDOFF);

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(ana).toMatchObject({ employeeName: "Ana Souza", mode: "awaiting_analyst" });
    expect(new Set(rows.map((row) => row.conversationId)).size).toBe(rows.length);
  });
});
