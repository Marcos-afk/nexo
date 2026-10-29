import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { conversations, messages } from "../../src/db/schema";
import {
  ConversationAssignedToOtherError,
  ConversationNotFoundError,
} from "../../src/domain/errors";
import type { RealtimeEvent } from "../../src/domain/realtime";
import { createConsoleService } from "../../src/services/console/console-service";
import { createHandoffService } from "../../src/services/handoff/handoff-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-29T10:00:00-03:00";
const RAFAEL = "analyst-rafael";
const LIA = "analyst-lia";
const ANA_HANDOFF = "c-ana-handoff";
const ANA = "emp-ana";

const setup = async () => {
  const database = await createSeededDatabase();
  const published: RealtimeEvent[] = [];
  const deps = {
    database,
    clock: createFixedClock(NOW),
    ids: createSequentialIds("new"),
    events: { publish: (event: RealtimeEvent) => void published.push(event) },
  };

  return {
    database,
    published,
    service: createConsoleService(deps),
    handoff: createHandoffService(deps),
  };
};

describe("getConversation", () => {
  it("returns the header, the linked ticket and the identified messages", async () => {
    const { service } = await setup();
    const conversation = await service.getConversation(RAFAEL, ANA_HANDOFF);

    expect(conversation).toMatchObject({
      id: ANA_HANDOFF,
      viewerId: RAFAEL,
      employee: { name: "Ana Souza", department: "Financeiro" },
      mode: "awaiting_analyst",
      handoffLevel: "N1",
      ticket: { number: "INC-20311" },
      assignedAnalyst: null,
    });
    expect(conversation.messages.map((message) => message.authorKind)).toEqual([
      "employee",
      "agent",
      "employee",
    ]);
  });

  it("names the analyst who answered and tells whether the employee already read it", async () => {
    const { handoff, service } = await setup();

    await handoff.assume(RAFAEL, ANA_HANDOFF);
    await handoff.reply(RAFAEL, ANA_HANDOFF, "Oi, Ana. Já estou vendo.");
    const conversation = await service.getConversation(RAFAEL, ANA_HANDOFF);
    const reply = conversation.messages.find((message) => message.authorKind === "analyst");

    expect(conversation.assignedAnalyst).toMatchObject({ id: RAFAEL, name: "Rafael Lima" });
    expect(reply).toMatchObject({
      authorName: "Rafael Lima",
      authorLevel: "N2",
      readByEmployee: false,
    });
  });

  it("refuses an unknown conversation and someone who is not an analyst", async () => {
    const { service } = await setup();

    await expect(service.getConversation(RAFAEL, "c-nenhuma")).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(service.getConversation(ANA, ANA_HANDOFF)).rejects.toThrow();
  });
});

describe("markRead", () => {
  it("clears the unread count until the employee writes again", async () => {
    const { database, service } = await setup();

    await service.markRead(RAFAEL, ANA_HANDOFF);
    const [first] = (await service.list(RAFAEL)).items.filter((item) => item.id === ANA_HANDOFF);

    await database.insert(messages).values({
      id: "m-new",
      conversationId: ANA_HANDOFF,
      authorKind: "employee",
      authorId: ANA,
      content: "Ainda aguardo.",
      parts: null,
      createdAt: new Date("2026-10-29T10:30:00-03:00"),
      deliveredAt: null,
      readAt: null,
    });
    const [second] = (await service.list(RAFAEL)).items.filter((item) => item.id === ANA_HANDOFF);

    expect(first?.unread).toBe(0);
    expect(second?.unread).toBe(1);
  });

  it("announces the change so the other lists refresh", async () => {
    const { published, service } = await setup();

    await service.markRead(RAFAEL, ANA_HANDOFF);

    expect(published).toEqual([
      expect.objectContaining({ type: "conversation.updated", conversationId: ANA_HANDOFF }),
    ]);
  });

  it("refuses an unknown conversation", async () => {
    const { service } = await setup();

    await expect(service.markRead(RAFAEL, "c-nenhuma")).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
  });
});

describe("taking a conversation", () => {
  it("keeps the first analyst on the conversation when the second one tries", async () => {
    const { database, handoff } = await setup();

    await handoff.assume(RAFAEL, ANA_HANDOFF);
    await handoff.assume(LIA, ANA_HANDOFF).catch(() => undefined);
    const [stored] = await database
      .select()
      .from(conversations)
      .where(eq(conversations.id, ANA_HANDOFF));

    expect(stored).toMatchObject({ mode: "with_analyst", assignedAnalystId: RAFAEL });
  });

  it("warns the second analyst that someone else already took it", async () => {
    const { handoff } = await setup();

    await handoff.assume(RAFAEL, ANA_HANDOFF);

    await expect(handoff.assume(LIA, ANA_HANDOFF)).rejects.toBeInstanceOf(
      ConversationAssignedToOtherError,
    );
  });
});

describe("transfer level", () => {
  const request = { reason: "Pedido", summary: "Resumo", urgency: "normal" } as const;

  it.each([
    ["an employee request", request, "N1"],
    ["an urgent request", { ...request, urgency: "urgent" }, "N2"],
    ["a low confidence request", { ...request, level: "N2" }, "N2"],
  ] as const)("sends %s to %s", async (_name, input, level) => {
    const { database, handoff } = await setup();
    const conversation = await handoff.request(ANA, "c-ana-chat", input);
    const [system] = await database
      .select()
      .from(messages)
      .where(eq(messages.conversationId, "c-ana-chat"))
      .orderBy(messages.createdAt)
      .then((rows) => rows.slice(-1));

    expect(conversation.handoffLevel).toBe(level);
    expect(system?.content).toBe(`Transferida para Suporte ${level} · agent pausado`);
  });
});

describe("case summary", () => {
  it("brings the transfer reason, the summary and the ticket priority", async () => {
    const { service } = await setup();
    const conversation = await service.getConversation(RAFAEL, ANA_HANDOFF);

    expect(conversation.handoffReason).toBe("Pedido do funcionário");
    expect(conversation.handoffSummary).toContain("INC-20311");
    expect(conversation.ticket?.priority).toBe("medium");
  });
});

describe("employee presence", () => {
  it("tells whether the employee is connected right now", async () => {
    const database = await createSeededDatabase();
    const online = new Set<string>();
    const service = createConsoleService({
      database,
      clock: createFixedClock(NOW),
      presence: { isOnline: (userId) => online.has(userId) },
    });

    expect((await service.getConversation(RAFAEL, ANA_HANDOFF)).employeeOnline).toBe(false);

    online.add(ANA);

    expect((await service.getConversation(RAFAEL, ANA_HANDOFF)).employeeOnline).toBe(true);
  });
});
