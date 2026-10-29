import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import {
  type ChatOrchestratorDeps,
  handleChatMessage,
} from "../../src/conversation/chat-orchestrator";
import { ModelUnavailableError } from "../../src/domain/errors";
import { createConversationService } from "../../src/services/conversations/conversation-service";
import { createChatDeps } from "../support/chat-deps";
import { agentMessagesOf, decisionOf, sendAs } from "../support/chat-flow";
import {
  createFailingModel,
  createFailingStreamModel,
  createMockObjectModel,
  createMockStreamModel,
} from "../support/mock-model";

const EMPLOYEE = "emp-fabio";

const triageOf = (overrides: Record<string, unknown>) => ({
  intent: "how_to",
  understood: "Problema de VPN.",
  confidence: 90,
  rationale: "Descrição clara.",
  signals: [],
  ...overrides,
});

const send = (deps: ChatOrchestratorDeps, text: string) => sendAs(deps, EMPLOYEE, text);

const agentMessages = (deps: ChatOrchestratorDeps) => agentMessagesOf(deps, EMPLOYEE);

const humanRequestTriage = triageOf({ intent: "human_request", signals: ["asks_for_human"] });

describe("handleChatMessage", () => {
  it("answers with the support model and records the decision with summed tokens", async () => {
    const support = createMockStreamModel("Reinicie o cliente VPN.", { input: 100, output: 20 });
    const triage = createMockObjectModel(triageOf({}), { input: 30, output: 10 });
    const deps = await createChatDeps({ triage: triage.model, support: support.model });

    const reply = await send(deps, "Meu VPN caiu");
    const [message] = await agentMessages(deps);
    const decision = await decisionOf(deps, message?.id);

    expect(reply.kind).toBe("stream");
    expect(message?.content).toBe("Reinicie o cliente VPN.");
    expect(decision).toMatchObject({
      messageId: message?.id,
      intent: "how_to",
      tokensIn: 130,
      tokensOut: 30,
      model: "google/gemini-3.6-flash",
    });
  });

  it("uses a fixed reply for an out-of-scope topic without calling the support model", async () => {
    const support = createMockStreamModel("nunca");
    const triage = createMockObjectModel(
      triageOf({ intent: "out_of_scope", signals: ["non_it_topic"] }),
    );
    const deps = await createChatDeps({ triage: triage.model, support: support.model });

    await send(deps, "Quando cai o meu pagamento?");
    const [message] = await agentMessages(deps);
    const decision = await decisionOf(deps, message?.id);

    expect(support.callCount()).toBe(0);
    expect(message?.content).toContain("não é de TI");
    expect(decision?.messageId).toBe(message?.id);
  });

  it("hands the conversation to an analyst when the employee asks for one", async () => {
    const triage = createMockObjectModel(humanRequestTriage);
    const deps = await createChatDeps({ triage: triage.model });

    await send(deps, "Quero falar com um analista");
    const conversation = await createConversationService(deps.conversations).getActive(EMPLOYEE);

    expect(conversation?.mode).toBe("awaiting_analyst");
  });

  it("skips the models once the conversation is no longer with the agent", async () => {
    const triage = createMockObjectModel(humanRequestTriage);
    const deps = await createChatDeps({ triage: triage.model });

    await send(deps, "Quero falar com um analista");
    const reply = await send(deps, "Alguém aí?");

    expect(reply).toEqual({ kind: "skipped", mode: "awaiting_analyst" });
    expect(triage.callCount()).toBe(1);
  });

  it("raises a typed error and stores no agent message when triage fails", async () => {
    const failing = createFailingModel(
      new APICallError({
        message: "falha",
        url: "https://example.test",
        requestBodyValues: {},
        statusCode: 503,
      }),
    );
    const deps = await createChatDeps({ triage: failing.model });

    await expect(handleChatMessage(deps, EMPLOYEE, "Meu VPN caiu")).rejects.toBeInstanceOf(
      ModelUnavailableError,
    );
    expect(await agentMessages(deps)).toEqual([]);
  });
});

describe("handleChatMessage: support model failure", () => {
  it("tells the employee in Portuguese when the support model hits its quota", async () => {
    const failing = createFailingStreamModel(
      new APICallError({
        message: "quota",
        url: "https://example.test",
        requestBodyValues: {},
        statusCode: 429,
        responseBody: "Please retry in 4h53m26.098059947s.",
      }),
    );
    const deps = await createChatDeps({
      triage: createMockObjectModel(triageOf({})).model,
      support: failing.model,
    });

    const outcome = await handleChatMessage(deps, EMPLOYEE, "Meu VPN caiu").then(
      async (reply) => {
        const chunks: unknown[] = [];

        if (reply.kind === "stream") {
          await reply.stream.pipeTo(
            new WritableStream({ write: (chunk) => void chunks.push(chunk) }),
          );
        }

        return { chunks };
      },
      (error: unknown) => ({ error }),
    );

    expect(JSON.stringify(outcome)).toContain("limite de uso");
    expect(JSON.stringify(outcome)).not.toContain("example.test");
    expect(JSON.stringify(outcome)).not.toContain("stack");
    expect(await agentMessages(deps)).toEqual([]);
  });
});
