import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import {
  type ChatOrchestratorDeps,
  type ChatReply,
  handleChatMessage,
} from "../../src/conversation/chat-orchestrator";
import { ModelUnavailableError } from "../../src/domain/errors";
import { createConversationService } from "../../src/services/conversations/conversation-service";
import { createChatDeps } from "../support/chat-deps";
import {
  createFailingModel,
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

const drain = async (reply: ChatReply): Promise<void> => {
  if (reply.kind === "stream") {
    await reply.stream.pipeTo(new WritableStream());
  }
};

const send = async (deps: ChatOrchestratorDeps, text: string): Promise<ChatReply> => {
  const reply = await handleChatMessage(deps, EMPLOYEE, text);
  await drain(reply);

  return reply;
};

const agentMessages = async (deps: ChatOrchestratorDeps) => {
  const service = createConversationService(deps.conversations);
  const conversation = await service.getActive(EMPLOYEE);
  const stored = await service.listMessages({
    ownerId: EMPLOYEE,
    conversationId: conversation?.id ?? "",
  });

  return stored.filter((message) => message.authorKind === "agent");
};

const decisionOf = async (deps: ChatOrchestratorDeps, messageId: string | undefined) =>
  (await deps.conversations.database.query.decisions.findMany()).find(
    (decision) => decision.messageId === messageId,
  );

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
