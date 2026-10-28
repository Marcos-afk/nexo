import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { conversations, employees, ticketEvents, tickets } from "../../src/db/schema";
import {
  AnalystRequiredError,
  ConversationAssignedToOtherError,
  ConversationNotFoundError,
  InvalidConversationTransitionError,
  TicketClosedError,
} from "../../src/domain/errors";
import type { HandoffInput } from "../../src/domain/handoff";
import { createHandoffService } from "../../src/services/handoff/handoff-service";
import { createTicketService } from "../../src/services/tickets/ticket-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T10:00:00-03:00";
const ANA = "emp-ana";
const CARLA = "emp-carla";
const RAFAEL = "analyst-rafael";
const ANA_CHAT = "c-ana-chat";
const ANA_HANDOFF = "c-ana-handoff";
const CARLA_CHAT = "c-carla";

const request: HandoffInput = {
  reason: "Pedido do funcionário",
  summary: "Ana pediu atendimento sobre o monitor.",
  urgency: "normal",
};

const createServices = async () => {
  const database = await createSeededDatabase();
  const deps = { database, clock: createFixedClock(NOW), ids: createSequentialIds("new") };

  return {
    database,
    handoff: createHandoffService(deps),
    tickets: createTicketService(deps),
  };
};

const conversationOf = async (
  database: Awaited<ReturnType<typeof createServices>>["database"],
  id: string,
) => {
  const [conversation] = await database
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));

  return conversation;
};

describe("request handoff", () => {
  it("moves the conversation to the queue with reason, summary and contact deadline", async () => {
    const { database, handoff } = await createServices();
    await handoff.request(ANA, ANA_CHAT, request);
    const conversation = await conversationOf(database, ANA_CHAT);

    expect(conversation).toMatchObject({
      mode: "awaiting_analyst",
      handoffReason: request.reason,
      handoffSummary: request.summary,
    });
    expect(conversation?.contactDueAt?.toISOString()).toBe(
      new Date("2026-10-28T12:00:00-03:00").toISOString(),
    );
  });

  it("transfers the cited ticket of the employee along with the conversation", async () => {
    const { database, handoff } = await createServices();
    const conversation = await handoff.request(ANA, ANA_CHAT, {
      ...request,
      ticketNumber: "INC-20298",
    });
    const [ticket] = await database.select().from(tickets).where(eq(tickets.number, "INC-20298"));

    expect(conversation.ticketId).toBe(ticket?.id);
    expect(ticket?.status).toBe("awaiting_analyst");
  });

  it("refuses a ticket that belongs to someone else", async () => {
    const { handoff } = await createServices();

    await expect(
      handoff.request(ANA, ANA_CHAT, { ...request, ticketNumber: "INC-20150" }),
    ).rejects.toThrow(/INC-20150/);
  });

  it("refuses to transfer twice", async () => {
    const { handoff } = await createServices();

    await expect(handoff.request(ANA, ANA_HANDOFF, request)).rejects.toBeInstanceOf(
      InvalidConversationTransitionError,
    );
  });

  it("treats another employee conversation as nonexistent", async () => {
    const { handoff } = await createServices();

    await expect(handoff.request(CARLA, ANA_CHAT, request)).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
  });
});

describe("queue (D-09)", () => {
  it("lists waiting conversations first, oldest first", async () => {
    const { handoff } = await createServices();
    const queue = await handoff.listQueue(RAFAEL);

    expect(queue.slice(0, 3).map((item) => item.conversation.id)).toEqual([
      "c-bruno",
      ANA_HANDOFF,
      CARLA_CHAT,
    ]);
    expect(queue[0]?.employeeName).toBe("Bruno Tavares");
  });

  it("filters by mode", async () => {
    const { handoff } = await createServices();
    const queue = await handoff.listQueue(RAFAEL, { mode: "closed" });

    expect(queue.every((item) => item.conversation.mode === "closed")).toBe(true);
  });

  it("is restricted to analysts", async () => {
    const { handoff } = await createServices();

    await expect(handoff.listQueue(ANA)).rejects.toBeInstanceOf(AnalystRequiredError);
  });
});

describe("analyst attendance", () => {
  it("assumes a conversation, pauses the agent and moves the linked ticket along", async () => {
    const { database, handoff } = await createServices();
    const conversation = await handoff.assume(RAFAEL, ANA_HANDOFF);
    const [ticket] = await database.select().from(tickets).where(eq(tickets.number, "INC-20311"));
    const events = await database
      .select()
      .from(ticketEvents)
      .where(eq(ticketEvents.ticketId, "t-inc-20311"));

    expect(conversation).toMatchObject({ mode: "with_analyst", assignedAnalystId: RAFAEL });
    expect(ticket?.status).toBe("in_progress");
    expect(events.map((event) => event.kind)).toContain("assumed");
  });

  it("allows only analysts to assume", async () => {
    const { handoff } = await createServices();

    await expect(handoff.assume(ANA, ANA_HANDOFF)).rejects.toBeInstanceOf(AnalystRequiredError);
  });

  it("locks replies until the conversation is assumed", async () => {
    const { handoff } = await createServices();

    await expect(handoff.reply(RAFAEL, CARLA_CHAT, "Olá")).rejects.toBeInstanceOf(
      InvalidConversationTransitionError,
    );

    await handoff.assume(RAFAEL, CARLA_CHAT);
    const message = await handoff.reply(RAFAEL, CARLA_CHAT, "Olá, Carla");

    expect(message).toMatchObject({ authorKind: "analyst", authorId: RAFAEL });
  });

  it("blocks another analyst from a conversation that was assumed", async () => {
    const { database, handoff } = await createServices();
    await database.insert(employees).values({
      id: "analyst-lucia",
      name: "Lúcia Prado",
      email: "lucia@nexo.test",
      department: "Service Desk",
      role: "analyst",
      level: "N1",
      availability: "online",
    });
    await handoff.assume(RAFAEL, CARLA_CHAT);

    await expect(handoff.returnToAgent("analyst-lucia", CARLA_CHAT)).rejects.toBeInstanceOf(
      ConversationAssignedToOtherError,
    );
    await expect(handoff.reply("analyst-lucia", CARLA_CHAT, "oi")).rejects.toBeInstanceOf(
      ConversationAssignedToOtherError,
    );
  });

  it("returns to the agent even before assuming and clears the deadline", async () => {
    const { database, handoff } = await createServices();
    await handoff.returnToAgent(RAFAEL, CARLA_CHAT);
    const conversation = await conversationOf(database, CARLA_CHAT);

    expect(conversation).toMatchObject({
      mode: "agent",
      assignedAnalystId: null,
      contactDueAt: null,
    });
  });

  it("closes only after assuming", async () => {
    const { handoff } = await createServices();

    await expect(handoff.close(RAFAEL, CARLA_CHAT)).rejects.toBeInstanceOf(
      InvalidConversationTransitionError,
    );

    await handoff.assume(RAFAEL, CARLA_CHAT);

    expect((await handoff.close(RAFAEL, CARLA_CHAT)).mode).toBe("closed");
  });
});

describe("ticket resolution by the analyst", () => {
  it("resolves any open ticket and records the resolution", async () => {
    const { database, tickets: ticketService } = await createServices();
    const resolved = await ticketService.resolve(RAFAEL, "t-inc-20298", "Acesso liberado");
    const events = await database
      .select()
      .from(ticketEvents)
      .where(eq(ticketEvents.ticketId, "t-inc-20298"));

    expect(resolved).toMatchObject({ status: "resolved" });
    expect(resolved.resolvedAt?.toISOString()).toBe(new Date(NOW).toISOString());
    expect(events.map((event) => event.payload)).toContainEqual({ resolution: "Acesso liberado" });
  });

  it("does not resolve an already resolved ticket", async () => {
    const { tickets: ticketService } = await createServices();

    await expect(ticketService.resolve(RAFAEL, "t-inc-19877", "x")).rejects.toBeInstanceOf(
      TicketClosedError,
    );
  });

  it("is restricted to analysts", async () => {
    const { tickets: ticketService } = await createServices();

    await expect(ticketService.resolve(ANA, "t-inc-20298", "x")).rejects.toBeInstanceOf(
      AnalystRequiredError,
    );
  });
});
