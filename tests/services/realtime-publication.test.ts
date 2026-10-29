import { describe, expect, it } from "vitest";
import { createConversationService } from "../../src/services/conversations/conversation-service";
import { createHandoffService } from "../../src/services/handoff/handoff-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createEventRecorder } from "../support/event-recorder";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T10:00:00-03:00";
const AT = "2026-10-28T13:00:00.000Z";
const ANA = "emp-ana";
const CARLA = "emp-carla";
const RAFAEL = "analyst-rafael";
const ANA_CHAT = "c-ana-chat";
const CARLA_CHAT = "c-carla";

const createServices = async () => {
  const database = await createSeededDatabase();
  const recorder = createEventRecorder();
  const deps = {
    database,
    clock: createFixedClock(NOW),
    ids: createSequentialIds("new"),
    events: recorder,
  };

  return {
    recorder,
    conversations: createConversationService(deps),
    handoff: createHandoffService(deps),
  };
};

describe("realtime publication from the conversation service", () => {
  it("announces the new conversation on start", async () => {
    const { conversations, recorder } = await createServices();
    const started = await conversations.start(ANA);

    expect(recorder.events).toEqual([
      {
        type: "conversation.updated",
        conversationId: started.id,
        ownerId: ANA,
        at: AT,
        mode: "agent",
        assignedAnalystId: null,
      },
    ]);
  });

  it("announces the appended message without its content", async () => {
    const { conversations, recorder } = await createServices();
    const message = await conversations.appendMessage(
      { ownerId: ANA, conversationId: ANA_CHAT },
      { authorKind: "employee", content: "texto secreto" },
    );

    expect(recorder.events).toEqual([
      {
        type: "message.created",
        conversationId: ANA_CHAT,
        ownerId: ANA,
        at: AT,
        messageId: message.id,
        authorKind: "employee",
      },
    ]);
    expect(JSON.stringify(recorder.events)).not.toContain("texto secreto");
  });

  it("does not announce when the append fails", async () => {
    const { conversations, recorder } = await createServices();

    await expect(
      conversations.appendMessage(
        { ownerId: CARLA, conversationId: ANA_CHAT },
        { authorKind: "employee", content: "oi" },
      ),
    ).rejects.toThrow();
    expect(recorder.events).toEqual([]);
  });

  it("announces the closed conversation", async () => {
    const { conversations, recorder } = await createServices();
    await conversations.close({ ownerId: ANA, conversationId: ANA_CHAT });

    expect(recorder.events).toMatchObject([{ type: "conversation.updated", mode: "closed" }]);
  });
});

describe("realtime publication from the handoff service", () => {
  it("announces the system message and then the conversation on transfer", async () => {
    const { handoff, recorder } = await createServices();
    await handoff.request(ANA, ANA_CHAT, {
      reason: "Pedido",
      summary: "Resumo",
      urgency: "normal",
    });

    expect(recorder.events).toMatchObject([
      { type: "message.created", authorKind: "system", ownerId: ANA },
      { type: "conversation.updated", mode: "awaiting_analyst", ownerId: ANA },
    ]);
  });

  it("announces the assigned analyst on assume", async () => {
    const { handoff, recorder } = await createServices();
    await handoff.assume(RAFAEL, CARLA_CHAT);

    expect(recorder.events).toMatchObject([
      { type: "message.created", authorKind: "system", ownerId: CARLA },
      { type: "conversation.updated", mode: "with_analyst", assignedAnalystId: RAFAEL },
    ]);
  });

  it.each([
    { action: "returnToAgent", mode: "agent" },
    { action: "close", mode: "closed" },
  ] as const)("announces $mode after $action", async ({ action, mode }) => {
    const { handoff, recorder } = await createServices();
    await handoff.assume(RAFAEL, CARLA_CHAT);
    const before = recorder.events.length;
    await handoff[action](RAFAEL, CARLA_CHAT);

    expect(recorder.events.slice(before)).toMatchObject([
      { type: "message.created", authorKind: "system" },
      { type: "conversation.updated", mode, assignedAnalystId: null },
    ]);
  });

  it("announces the analyst reply to the conversation owner", async () => {
    const { handoff, recorder } = await createServices();
    await handoff.assume(RAFAEL, CARLA_CHAT);
    const before = recorder.events.length;
    await handoff.reply(RAFAEL, CARLA_CHAT, "Olá, Carla");

    expect(recorder.events.slice(before)).toMatchObject([
      { type: "message.created", authorKind: "analyst", ownerId: CARLA },
    ]);
  });

  it("does not announce a rejected transition", async () => {
    const { handoff, recorder } = await createServices();

    await expect(handoff.assume(ANA, CARLA_CHAT)).rejects.toThrow();
    expect(recorder.events).toEqual([]);
  });
});
