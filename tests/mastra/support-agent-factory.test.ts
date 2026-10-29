import { describe, expect, it } from "vitest";
import { agentToolNames } from "../../src/domain/turn-policy";
import {
  buildSupportInstructions,
  createSupportAgent,
  selectTools,
} from "../../src/mastra/agents/support-agent-factory";
import { createAgentTools } from "../../src/mastra/tools/agent";
import { createDraftService } from "../../src/services/drafts/draft-service";
import { createHandoffService } from "../../src/services/handoff/handoff-service";
import { createHelpCenterService } from "../../src/services/help-center/help-center-service";
import { createTicketService } from "../../src/services/tickets/ticket-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";
import { createMockTextModel } from "../support/mock-model";

const createTools = async () => {
  const database = await createSeededDatabase();
  const clock = createFixedClock("2026-10-28T10:00:00-03:00");
  const deps = { database, clock, ids: createSequentialIds("agent") };

  return createAgentTools({
    tickets: createTicketService(deps),
    helpCenter: createHelpCenterService({ database }),
    drafts: createDraftService(deps),
    handoff: createHandoffService(deps),
    clock,
  });
};

describe("selectTools", () => {
  it("keeps only the requested tools", async () => {
    const selected = selectTools(await createTools(), ["getTicket", "listMyTickets"]);

    expect(Object.keys(selected).toSorted()).toEqual(["getTicket", "listMyTickets"]);
  });

  it("returns no tools when none is allowed", async () => {
    expect(selectTools(await createTools(), [])).toEqual({});
  });
});

describe("buildSupportInstructions", () => {
  it.each([
    { tool: "buildDraft", text: "Nunca presuma quem é afetado" },
    { tool: "findSimilarTickets", text: "categorias da lista" },
  ] as const)("tells the model how to use $tool", ({ tool, text }) => {
    expect(buildSupportInstructions([tool], false)).toContain(text);
  });

  it("always carries the privacy and scope rules", () => {
    const instructions = buildSupportInstructions([], false);

    expect(instructions).toContain("outra pessoa");
    expect(instructions).toContain("assuntos de TI");
  });

  it.each(agentToolNames)("adds the guidance of %s only when the tool is allowed", (toolName) => {
    const withTool = buildSupportInstructions([toolName], false);
    const without = buildSupportInstructions([], false);

    expect(withTool.length).toBeGreaterThan(without.length);
  });

  it("adds the analyst offer only for overdue tickets", () => {
    expect(buildSupportInstructions([], true)).toContain("chamado vencido");
    expect(buildSupportInstructions([], false)).not.toContain("chamado vencido");
  });

  it("makes clear that the draft is never a created ticket", () => {
    expect(buildSupportInstructions(["buildDraft"], false)).toContain("Confirmar");
  });
});

describe("createSupportAgent", () => {
  it("answers through the injected model without touching Gemini", async () => {
    const mock = createMockTextModel("Olá, Ana!");
    const agent = createSupportAgent({
      tools: await createTools(),
      toolNames: [],
      offerAnalyst: false,
      model: mock.model,
    });
    const result = await agent.generate("oi");

    expect(result.text).toBe("Olá, Ana!");
    expect(mock.callCount()).toBe(1);
  });
});
