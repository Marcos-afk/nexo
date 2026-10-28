import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ticketEvents } from "../../src/db/schema";
import {
  TicketClosedError,
  TicketNotFoundError,
  TicketNotReopenableError,
  type TicketReopenFailure,
} from "../../src/domain/errors";
import type { CreateTicketInput } from "../../src/domain/ticket-input";
import { createTicketService, type TicketService } from "../../src/services/tickets/ticket-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T09:43:00-03:00";
const HIGH_PRIORITY_DUE_AT = "2026-10-28T13:43:00-03:00";
const ANA = "emp-ana";
const CARLA = "emp-carla";
const CARLA_TICKET = "INC-20150";

const createService = async () => {
  const database = await createSeededDatabase();
  const service = createTicketService({
    database,
    clock: createFixedClock(NOW),
    ids: createSequentialIds("new"),
  });

  return { database, service };
};

const monitorTicket: CreateTicketInput = {
  type: "incident",
  category: "Hardware",
  subcategory: "Periféricos",
  title: "Monitor externo sem imagem",
  description: "O monitor externo parou de dar imagem.",
  priority: "high",
  affected: "Somente eu",
};

interface ForeignAccessCase {
  readonly action: string;
  readonly act: (service: TicketService) => Promise<unknown>;
}

const foreignAccessCases: readonly ForeignAccessCase[] = [
  {
    action: "update",
    act: (service) => service.addNote({ ownerId: ANA, number: CARLA_TICKET }, "oi"),
  },
  {
    action: "reopen",
    act: (service) => service.reopen({ ownerId: ANA, number: CARLA_TICKET }),
  },
  {
    action: "transfer",
    act: (service) => service.transferToAnalyst({ ownerId: ANA, number: CARLA_TICKET }, "motivo"),
  },
];

const eventsOf = async (
  database: Awaited<ReturnType<typeof createService>>["database"],
  ticketId: string,
) => database.select().from(ticketEvents).where(eq(ticketEvents.ticketId, ticketId));

describe("ticket privacy (P1 to P3)", () => {
  it("lists only the owner tickets", async () => {
    const { service } = await createService();
    const tickets = await service.list(ANA);

    expect(tickets).toHaveLength(5);
    expect(tickets.every((ticket) => ticket.ownerId === ANA)).toBe(true);
  });

  it("filters the list by status", async () => {
    const { service } = await createService();
    const tickets = await service.list(ANA, { status: "resolved" });

    expect(tickets.map((ticket) => ticket.number).sort()).toEqual(["INC-19410", "INC-19877"]);
  });

  it("respects the requested page size", async () => {
    const { service } = await createService();

    expect(await service.list(ANA, { limit: 2 })).toHaveLength(2);
  });

  it("does not return another person ticket even when the number is cited", async () => {
    const { service } = await createService();

    expect(await service.get({ ownerId: ANA, number: CARLA_TICKET })).toBeNull();
    expect((await service.get({ ownerId: CARLA, number: CARLA_TICKET }))?.ownerId).toBe(CARLA);
  });

  it.each(foreignAccessCases)(
    "refuses to $action a ticket owned by someone else",
    async ({ act }) => {
      const { service } = await createService();

      await expect(act(service)).rejects.toBeInstanceOf(TicketNotFoundError);
    },
  );
});

describe("create", () => {
  it("numbers incidents and requests independently", async () => {
    const { service } = await createService();
    const incident = await service.create(ANA, monitorTicket);
    const request = await service.create(ANA, { ...monitorTicket, type: "request" });

    expect(incident.number).toBe("INC-20520");
    expect(request.number).toBe("REQ-10443");
  });

  it("sets the deadline from the priority and records the created event", async () => {
    const { database, service } = await createService();
    const ticket = await service.create(ANA, monitorTicket);
    const events = await eventsOf(database, ticket.id);

    expect(ticket.status).toBe("open");
    expect(ticket.dueAt.toISOString()).toBe(new Date(HIGH_PRIORITY_DUE_AT).toISOString());
    expect(events.map((event) => event.kind)).toEqual(["created"]);
  });
});

describe("duplicates (D1, D3, D4)", () => {
  it("finds the open ticket of the same category for the same owner", async () => {
    const { service } = await createService();
    const similar = await service.findSimilar(ANA, "Acesso");

    expect(similar.open.map((ticket) => ticket.number)).toEqual(["INC-20298"]);
    expect(similar.recentlyResolved).toEqual([]);
  });

  it("offers a ticket resolved 4 days ago for reopening", async () => {
    const { service } = await createService();
    const similar = await service.findSimilar(CARLA, "Acesso");

    expect(similar.recentlyResolved.map((ticket) => ticket.number)).toEqual([CARLA_TICKET]);
  });
});

describe("addNote (D5)", () => {
  it("appends the note as an event and touches the ticket", async () => {
    const { database, service } = await createService();
    const note = "Agora também falha no Teams";
    const ticket = await service.addNote({ ownerId: ANA, number: "INC-20298" }, note);
    const events = await eventsOf(database, ticket.id);

    expect(ticket.updatedAt.toISOString()).toBe(new Date(NOW).toISOString());
    expect(events.map((event) => event.payload)).toContainEqual({ note });
  });

  it("refuses to update a resolved ticket", async () => {
    const { service } = await createService();

    await expect(
      service.addNote({ ownerId: ANA, number: "INC-19877" }, "voltou"),
    ).rejects.toBeInstanceOf(TicketClosedError);
  });
});

interface ReopenFailureCase {
  readonly name: string;
  readonly number: string;
  readonly failure: TicketReopenFailure;
}

const reopenFailureCases: readonly ReopenFailureCase[] = [
  { name: "resolved more than 7 days ago", number: "INC-19877", failure: "window_expired" },
  { name: "not resolved", number: "INC-20311", failure: "not_resolved" },
];

describe("reopen (D3, D4)", () => {
  it("reopens INC-20150, resolved 4 days ago, and restarts its deadline", async () => {
    const { database, service } = await createService();
    const ticket = await service.reopen({ ownerId: CARLA, number: CARLA_TICKET });
    const events = await eventsOf(database, ticket.id);

    expect(ticket.status).toBe("open");
    expect(ticket.resolvedAt).toBeNull();
    expect(ticket.dueAt.toISOString()).toBe(new Date(HIGH_PRIORITY_DUE_AT).toISOString());
    expect(events.map((event) => event.kind)).toContain("reopened");
  });

  it.each(reopenFailureCases)("refuses a ticket that is $name", async ({ number, failure }) => {
    const { service } = await createService();
    const error = await service.reopen({ ownerId: ANA, number }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TicketNotReopenableError);
    expect(error).toMatchObject({ failure });
  });
});

describe("transfer", () => {
  it("moves the ticket to the analyst queue and records the reason", async () => {
    const { database, service } = await createService();
    const reason = "Pedido do funcionário";
    const ticket = await service.transferToAnalyst({ ownerId: ANA, number: "INC-20298" }, reason);
    const events = await eventsOf(database, ticket.id);

    expect(ticket.status).toBe("awaiting_analyst");
    expect(events.map((event) => event.payload)).toContainEqual({ reason });
  });
});
