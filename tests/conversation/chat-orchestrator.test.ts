import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import {
  type ChatOrchestratorDeps,
  handleChatMessage,
} from "../../src/conversation/chat-orchestrator";
import { ModelUnavailableError } from "../../src/domain/errors";
import { createModelChain } from "../../src/mastra/models";
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
    const support = createMockStreamModel(
      "Reinicie o cliente VPN.",
      { input: 100, output: 20 },
      "gemini-3.6-flash",
    );
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

const quotaError = () =>
  new APICallError({
    message: "quota",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode: 429,
  });

const unavailableError = () =>
  new APICallError({
    message: "high demand",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode: 503,
  });

describe("handleChatMessage: model rotation", () => {
  it("answers with the next support model when the first one is out of quota", async () => {
    const exhausted = createFailingStreamModel(quotaError(), "gemini-3.6-flash");
    const backup = createMockStreamModel("Resposta do reserva.", undefined, "gemini-3.5-flash");
    const deps = await createChatDeps({
      triage: createMockObjectModel(triageOf({})).model,
      support: createModelChain([exhausted.model, backup.model]),
    });

    await send(deps, "Meu VPN caiu");
    const [message] = await agentMessages(deps);
    const decision = await decisionOf(deps, message?.id);

    expect(message?.content).toBe("Resposta do reserva.");
    expect(decision?.model).toBe("google/gemini-3.5-flash");
    expect([exhausted.callCount(), backup.callCount()]).toEqual([1, 1]);
  });

  it("uses the next triage model when the first one is unavailable", async () => {
    const down = createFailingModel(unavailableError(), "gemini-3.5-flash-lite");
    const backup = createMockObjectModel(
      triageOf({ intent: "out_of_scope", signals: ["non_it_topic"] }),
      undefined,
      "gemini-3.1-flash-lite",
    );
    const deps = await createChatDeps({ triage: createModelChain([down.model, backup.model]) });

    await send(deps, "Quando cai o meu pagamento?");
    const [message] = await agentMessages(deps);
    const decision = await decisionOf(deps, message?.id);

    expect(decision?.model).toBe("google/gemini-3.1-flash-lite");
    expect([down.callCount(), backup.callCount()]).toEqual([1, 1]);
  });

  it("reports the quota to the employee once every support model is exhausted", async () => {
    const first = createFailingStreamModel(quotaError(), "gemini-3.6-flash");
    const second = createFailingStreamModel(quotaError(), "gemini-3.5-flash");
    const deps = await createChatDeps({
      triage: createMockObjectModel(triageOf({})).model,
      support: createModelChain([first.model, second.model]),
    });
    const reply = await handleChatMessage(deps, EMPLOYEE, "Meu VPN caiu");
    const chunks: unknown[] = [];

    if (reply.kind === "stream") {
      await reply.stream.pipeTo(new WritableStream({ write: (chunk) => void chunks.push(chunk) }));
    }

    expect(JSON.stringify(chunks)).toContain("limite de uso");
    expect([first.callCount(), second.callCount()]).toEqual([1, 1]);
    expect(await agentMessages(deps)).toEqual([]);
  });
});

describe("handleChatMessage: model health", () => {
  it("marks the model unavailable when triage fails", async () => {
    const failing = createFailingModel(unavailableError());
    const deps = await createChatDeps({ triage: failing.model });

    await expect(handleChatMessage(deps, EMPLOYEE, "Meu VPN caiu")).rejects.toBeInstanceOf(
      ModelUnavailableError,
    );
    expect(deps.modelHealth.state()).toBe("unavailable");
  });

  it("marks the quota as exhausted when every support model is out of quota", async () => {
    const exhausted = createFailingStreamModel(quotaError(), "gemini-3.6-flash");
    const deps = await createChatDeps({
      triage: createMockObjectModel(triageOf({})).model,
      support: createModelChain([exhausted.model]),
    });

    await send(deps, "Meu VPN caiu");

    expect(deps.modelHealth.state()).toBe("rate_limited");
  });

  it("goes back to ok after a turn answered by the support model", async () => {
    const deps = await createChatDeps({
      triage: createMockObjectModel(triageOf({})).model,
      support: createMockStreamModel("Reinicie o cliente VPN.").model,
    });
    deps.modelHealth.markFailure(new ModelUnavailableError());

    await send(deps, "Meu VPN caiu");

    expect(deps.modelHealth.state()).toBe("ok");
  });

  it("goes back to ok after a fixed reply, since triage worked", async () => {
    const deps = await createChatDeps({
      triage: createMockObjectModel(triageOf({ intent: "out_of_scope", signals: ["non_it_topic"] }))
        .model,
    });
    deps.modelHealth.markFailure(new ModelUnavailableError());

    await send(deps, "Quantos dias de férias eu tenho?");

    expect(deps.modelHealth.state()).toBe("ok");
  });
});
