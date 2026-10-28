import { Agent } from "@mastra/core/agent";
import { describe, expect, it } from "vitest";
import { triageSchema } from "@/domain/triage";
import { createMockObjectModel, createMockTextModel, type MockModel } from "../support/mock-model";

const buildAgent = ({ model }: MockModel) =>
  new Agent({ id: "test-agent", name: "Test", instructions: "Responda.", model });

describe("mock language model", () => {
  it("lets an agent answer without calling any provider", async () => {
    const mock = createMockTextModel("Olá, tudo bem?", { input: 12, output: 7 });

    const result = await buildAgent(mock).generate("oi");

    expect(result.text).toBe("Olá, tudo bem?");
    expect(result.usage.inputTokens).toBe(12);
    expect(result.usage.outputTokens).toBe(7);
    expect(mock.callCount()).toBe(1);
  });

  it("returns a validated structured object for the triage schema", async () => {
    const triage = {
      intent: "ticket_lookup",
      understood: "Quer ver os chamados.",
      confidence: 95,
      rationale: "Pergunta direta sobre chamados.",
      signals: [],
    };

    const result = await buildAgent(createMockObjectModel(triage)).generate("meus chamados", {
      structuredOutput: { schema: triageSchema },
    });

    expect(result.object).toEqual(triage);
  });
});
