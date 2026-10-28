import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { conversations, drafts, tickets } from "../../src/db/schema";
import { LegacyUnavailableError } from "../../src/domain/errors";
import type { CreateTicketInput } from "../../src/domain/ticket-input";
import type { Clock } from "../../src/lib/clock";
import { createDraftService } from "../../src/services/drafts/draft-service";
import { createHandoffService } from "../../src/services/handoff/handoff-service";
import { createLegacyGuard, createOutageSimulator } from "../../src/services/tickets/legacy-guard";
import { createTicketService } from "../../src/services/tickets/ticket-service";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const START_MS = new Date("2026-10-28T10:00:00-03:00").getTime();
const ANA = "emp-ana";
const SHORT_OUTAGE_MS = 300;
const LONG_OUTAGE_MS = 5_000;
const ADVANCE_AFTER_OUTAGE_MS = 6_000;

const monitorTicket: CreateTicketInput = {
  type: "incident",
  category: "Hardware",
  subcategory: "Periféricos",
  title: "Monitor externo sem imagem",
  description: "O monitor externo parou de dar imagem.",
  priority: "high",
  affected: "Somente eu",
};

const createEnvironment = async () => {
  const database = await createSeededDatabase();
  const time = { ms: START_MS };
  const clock: Clock = { now: () => new Date(time.ms) };
  const outage = createOutageSimulator(clock);
  const legacy = createLegacyGuard({
    outage,
    sleep: async (ms) => {
      time.ms += ms;
    },
  });
  const deps = { database, clock, ids: createSequentialIds("new"), legacy };

  return {
    database,
    outage,
    time,
    tickets: createTicketService(deps),
    drafts: createDraftService(deps),
    handoff: createHandoffService(deps),
  };
};

const countTickets = async (database: Awaited<ReturnType<typeof createEnvironment>>["database"]) =>
  (await database.select().from(tickets)).length;

describe("legacy outage (T7)", () => {
  it("recovers by itself when the outage is shorter than the retries", async () => {
    const { outage, tickets: ticketService } = await createEnvironment();
    outage.startFor(SHORT_OUTAGE_MS);

    const ticket = await ticketService.create(ANA, monitorTicket);

    expect(ticket.number).toBe("INC-20520");
  });

  it("reports unavailability with a clear message and creates nothing", async () => {
    const { database, outage, tickets: ticketService } = await createEnvironment();
    const before = await countTickets(database);
    outage.startFor(LONG_OUTAGE_MS);

    const error = await ticketService.create(ANA, monitorTicket).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LegacyUnavailableError);
    expect(error).toHaveProperty("message", expect.stringContaining("Nada foi criado"));
    expect(await countTickets(database)).toBe(before);
  });

  it("lets the user try again once the system is back", async () => {
    const { outage, time, tickets: ticketService } = await createEnvironment();
    outage.startFor(LONG_OUTAGE_MS);
    await ticketService.create(ANA, monitorTicket).catch(() => undefined);
    time.ms += ADVANCE_AFTER_OUTAGE_MS;

    expect((await ticketService.create(ANA, monitorTicket)).number).toBe("INC-20520");
  });

  it("keeps the draft pending when confirming during the outage", async () => {
    const { database, outage, drafts: draftService } = await createEnvironment();
    outage.startFor(LONG_OUTAGE_MS);

    await expect(draftService.confirm(ANA, "D-381")).rejects.toBeInstanceOf(LegacyUnavailableError);

    const [draft] = await database.select().from(drafts).where(eq(drafts.id, "D-381"));
    expect(draft?.status).toBe("pending");
  });

  it("leaves the conversation untouched when the transfer cannot reach the ticket system", async () => {
    const { database, outage, handoff } = await createEnvironment();
    outage.startFor(LONG_OUTAGE_MS);

    await expect(
      handoff.request(ANA, "c-ana-chat", {
        reason: "Pedido",
        summary: "Resumo",
        urgency: "normal",
        ticketNumber: "INC-20298",
      }),
    ).rejects.toBeInstanceOf(LegacyUnavailableError);

    const [conversation] = await database
      .select()
      .from(conversations)
      .where(eq(conversations.id, "c-ana-chat"));
    expect(conversation?.mode).toBe("agent");
  });
});
