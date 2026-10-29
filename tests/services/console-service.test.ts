import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { conversations } from "../../src/db/schema";
import { AnalystRequiredError } from "../../src/domain/errors";
import { createConsoleService } from "../../src/services/console/console-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";

const ANALYST = "analyst-rafael";
const NOW = "2026-10-29T10:00:00-03:00";

const setup = async () => {
  const database = await createSeededDatabase();

  return {
    database,
    service: createConsoleService({ database, clock: createFixedClock(NOW) }),
  };
};

describe("console list", () => {
  it("puts the conversations waiting for an analyst first, oldest first", async () => {
    const { service } = await setup();
    const { items } = await service.list(ANALYST);

    expect(items.map((item) => item.id)).toEqual([
      "c-bruno",
      "c-ana-handoff",
      "c-carla",
      "c-ana-chat",
      "c-diego",
      "c-elisa",
      "c-fabio",
      "c-gabriela",
    ]);
  });

  it("counts every group from the stored conversations", async () => {
    const { service } = await setup();
    const { counts, attention } = await service.list(ANALYST);

    expect(counts).toEqual({ all: 8, forYou: 3, withAgent: 3, mine: 0 });
    expect(attention).toBe(3);
  });

  it.each([
    ["for_you", ["c-bruno", "c-ana-handoff", "c-carla"]],
    ["with_agent", ["c-ana-chat", "c-diego", "c-elisa"]],
    ["mine", []],
  ] as const)("filters by %s", async (filter, expected) => {
    const { service } = await setup();
    const { items } = await service.list(ANALYST, { filter });

    expect(items.map((item) => item.id)).toEqual(expected);
  });

  it.each([
    ["the employee name", "diego", ["c-diego"]],
    ["the ticket number", "INC-20311", ["c-ana-handoff"]],
    ["a message excerpt", "impressora", ["c-elisa"]],
    ["nothing", "zzzz", []],
    ["a wildcard as plain text", "%", []],
  ])("searches by %s", async (_name, query, expected) => {
    const { service } = await setup();
    const { items } = await service.list(ANALYST, { query });

    expect(items.map((item) => item.id)).toEqual(expected);
  });

  it("derives the label and the preview of each item", async () => {
    const { service } = await setup();
    const { items } = await service.list(ANALYST);
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get("c-bruno")?.label).toEqual({ kind: "agent_asked_help", confidence: 41 });
    expect(byId.get("c-ana-handoff")?.label).toMatchObject({
      kind: "transferred",
      ticketNumber: "INC-20311",
    });
    expect(byId.get("c-diego")?.label).toEqual({ kind: "agent_active" });
    expect(byId.get("c-fabio")?.label).toEqual({ kind: "resolved_by_agent" });
    expect(byId.get("c-ana-handoff")?.preview?.text).toBe("Quero falar com uma pessoa, por favor.");
  });

  it("counts the employee messages that still wait for an answer", async () => {
    const { service } = await setup();
    const { items } = await service.list(ANALYST);
    const unread = Object.fromEntries(items.map((item) => [item.id, item.unread]));

    expect(unread["c-ana-handoff"]).toBe(1);
    expect(unread["c-carla"]).toBe(0);
    expect(unread["c-diego"]).toBe(0);
  });

  it("counts a taken conversation with news in the attention badge", async () => {
    const { database, service } = await setup();

    await database
      .update(conversations)
      .set({ mode: "with_analyst", assignedAnalystId: ANALYST })
      .where(eq(conversations.id, "c-ana-handoff"));
    const { counts, attention, items } = await service.list(ANALYST);

    expect(counts).toMatchObject({ forYou: 2, mine: 1 });
    expect(attention).toBe(3);
    expect(items.find((item) => item.id === "c-ana-handoff")?.label).toEqual({ kind: "mine" });
  });

  it("refuses someone who is not an analyst", async () => {
    const { service } = await setup();

    await expect(service.list("emp-ana")).rejects.toBeInstanceOf(AnalystRequiredError);
  });
});

describe("console availability", () => {
  it("stores the availability and shows it back", async () => {
    const { service } = await setup();

    await service.setAvailability(ANALYST, "offline");

    expect((await service.list(ANALYST)).me.availability).toBe("offline");
  });

  it("refuses someone who is not an analyst", async () => {
    const { service } = await setup();

    await expect(service.setAvailability("emp-ana", "offline")).rejects.toBeInstanceOf(
      AnalystRequiredError,
    );
  });
});
