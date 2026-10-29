import { describe, expect, it } from "vitest";
import {
  AnalystRequiredError,
  ConversationNotFoundError,
  TicketNotFoundError,
} from "../../src/domain/errors";
import { createConsoleService } from "../../src/services/console/console-service";
import { createDecisionService } from "../../src/services/decisions/decision-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-29T10:00:00-03:00";
const RAFAEL = "analyst-rafael";
const ANA_HANDOFF = "c-ana-handoff";

const setup = async () => {
  const database = await createSeededDatabase();

  return {
    database,
    service: createConsoleService({ database, clock: createFixedClock(NOW) }),
  };
};

describe("listTickets", () => {
  it("counts the open and the closed tickets of the employee and lists them newest first", async () => {
    const { service } = await setup();
    const result = await service.listTickets(RAFAEL, ANA_HANDOFF);

    expect(result).toMatchObject({ employeeName: "Ana Souza", open: 3, closed: 2 });
    expect(result.tickets.map(({ ticket }) => ticket.number)).toEqual([
      "INC-20311",
      "INC-20298",
      "REQ-10442",
      "INC-19877",
      "INC-19410",
    ]);
    expect(result.open + result.closed).toBe(result.tickets.length);
  });

  it("marks the ticket linked to the conversation and gives its last event", async () => {
    const { service } = await setup();
    const result = await service.listTickets(RAFAEL, ANA_HANDOFF);
    const current = result.tickets.filter((item) => item.isCurrent);

    expect(current.map(({ ticket }) => ticket.number)).toEqual(["INC-20311"]);
    expect(current[0]?.lastEvent?.text).toBeTruthy();
  });

  it("flags the tickets that passed their due date", async () => {
    const { service } = await setup();
    const result = await service.listTickets(RAFAEL, ANA_HANDOFF);
    const overdue = Object.fromEntries(
      result.tickets.map((item) => [item.ticket.number, item.overdue]),
    );

    expect(overdue["INC-20311"]).toBe(true);
    expect(overdue["INC-19877"]).toBe(false);
  });

  it("refuses an unknown conversation and someone who is not an analyst", async () => {
    const { service } = await setup();

    await expect(service.listTickets(RAFAEL, "c-nenhuma")).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(service.listTickets("emp-ana", ANA_HANDOFF)).rejects.toBeInstanceOf(
      AnalystRequiredError,
    );
  });
});

describe("getTicket", () => {
  it("returns the ticket with its history in order", async () => {
    const { service } = await setup();
    const detail = await service.getTicket(RAFAEL, ANA_HANDOFF, "INC-20311");

    expect(detail.ticket).toMatchObject({ number: "INC-20311", title: expect.any(String) });
    expect(detail.events[0]).toMatchObject({ kind: "created", text: "Chamado aberto" });
  });

  it("does not show a ticket that belongs to another employee", async () => {
    const { service } = await setup();

    await expect(service.getTicket(RAFAEL, ANA_HANDOFF, "INC-20517")).rejects.toBeInstanceOf(
      TicketNotFoundError,
    );
  });
});

describe("decisions for analysts", () => {
  it("lets an analyst read the decision of any conversation", async () => {
    const { database } = await setup();
    const decisions = createDecisionService({ database, ids: createSequentialIds("dec") });

    await expect(decisions.getForAnalyst("m-c-ana-handoff-2")).resolves.toMatchObject({
      id: "dec-ana-handoff",
    });
    await expect(decisions.getForMessage("emp-bruno", "m-c-ana-handoff-2")).rejects.toThrow();
  });
});
