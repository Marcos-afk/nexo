import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDatabase, migrateDatabase } from "../../src/db/client";
import { conversations, employees, messages } from "../../src/db/schema";
import { createStatsService } from "../../src/services/stats/stats-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";

const NOW = "2026-10-28T10:00:00-03:00";
const IN_MEMORY_URL = ":memory:";
const MS_PER_SECOND = 1000;
const MS_PER_DAY = 86_400_000;
const OWNER = "emp-1";

type TestDatabase = Awaited<ReturnType<typeof createSeededDatabase>>;

interface ConversationFixture {
  readonly id: string;
  readonly ageDays?: number;
  readonly replyAfterSeconds?: number;
  readonly handoff?: boolean;
}

const emptyDatabase = async (): Promise<TestDatabase> => {
  const database = createDatabase(IN_MEMORY_URL);
  await migrateDatabase(database);
  await database.insert(employees).values({
    id: OWNER,
    name: "Funcionário",
    email: "func@nexo.test",
    department: "TI",
    role: "employee",
  });

  return database;
};

const addConversation = async (database: TestDatabase, fixture: ConversationFixture) => {
  const startedAt = new Date(new Date(NOW).getTime() - (fixture.ageDays ?? 0) * MS_PER_DAY);

  await database.insert(conversations).values({
    id: fixture.id,
    employeeId: OWNER,
    mode: "agent",
    handoffReason: fixture.handoff ? "Pedido do funcionário" : null,
    createdAt: startedAt,
    updatedAt: startedAt,
  });
  await database.insert(messages).values({
    id: `${fixture.id}-employee`,
    conversationId: fixture.id,
    authorKind: "employee",
    content: "Preciso de ajuda",
    createdAt: startedAt,
  });

  if (fixture.replyAfterSeconds !== undefined) {
    await database.insert(messages).values({
      id: `${fixture.id}-agent`,
      conversationId: fixture.id,
      authorKind: "agent",
      content: "Claro",
      createdAt: new Date(startedAt.getTime() + fixture.replyAfterSeconds * MS_PER_SECOND),
    });
  }
};

const addAnalyst = (
  database: TestDatabase,
  id: string,
  availability: "online" | "busy" | "offline",
) =>
  database.insert(employees).values({
    id,
    name: id,
    email: `${id}@nexo.test`,
    department: "Service Desk",
    role: "analyst",
    level: "N1",
    availability,
  });

const statsOf = (database: TestDatabase) =>
  createStatsService({ database, clock: createFixedClock(NOW) }).loginStats();

describe("loginStats: no data", () => {
  it("returns no metric instead of inventing one", async () => {
    expect(await statsOf(await emptyDatabase())).toEqual({
      firstResponseSeconds: null,
      resolvedWithoutQueuePercent: null,
      analystsOnline: 0,
    });
  });
});

describe("loginStats: first response", () => {
  it("averages the time to the first agent reply across conversations", async () => {
    const database = await emptyDatabase();
    await addConversation(database, { id: "c-1", replyAfterSeconds: 10 });
    await addConversation(database, { id: "c-2", replyAfterSeconds: 20 });

    expect((await statsOf(database)).firstResponseSeconds).toBe(15);
  });

  it("ignores conversations the agent never answered", async () => {
    const database = await emptyDatabase();
    await addConversation(database, { id: "c-1", replyAfterSeconds: 8 });
    await addConversation(database, { id: "c-2" });

    expect((await statsOf(database)).firstResponseSeconds).toBe(8);
  });

  it("ignores conversations older than the 30-day window", async () => {
    const database = await emptyDatabase();
    await addConversation(database, { id: "c-new", replyAfterSeconds: 8 });
    await addConversation(database, { id: "c-old", ageDays: 45, replyAfterSeconds: 100 });

    expect((await statsOf(database)).firstResponseSeconds).toBe(8);
  });
});

describe("loginStats: resolved without queue", () => {
  it("is the share of answered conversations that never reached an analyst", async () => {
    const database = await emptyDatabase();
    await addConversation(database, { id: "c-1", replyAfterSeconds: 5 });
    await addConversation(database, { id: "c-2", replyAfterSeconds: 5 });
    await addConversation(database, { id: "c-3", replyAfterSeconds: 5, handoff: true });

    expect((await statsOf(database)).resolvedWithoutQueuePercent).toBe(67);
  });

  it("does not count conversations the agent never answered", async () => {
    const database = await emptyDatabase();
    await addConversation(database, { id: "c-1", replyAfterSeconds: 5, handoff: true });
    await addConversation(database, { id: "c-2" });

    expect((await statsOf(database)).resolvedWithoutQueuePercent).toBe(0);
  });

  it("ignores conversations older than the 30-day window", async () => {
    const database = await emptyDatabase();
    await addConversation(database, { id: "c-new", replyAfterSeconds: 5 });
    await addConversation(database, {
      id: "c-old",
      ageDays: 45,
      replyAfterSeconds: 5,
      handoff: true,
    });

    expect((await statsOf(database)).resolvedWithoutQueuePercent).toBe(100);
  });
});

describe("loginStats: analysts online", () => {
  it("counts only analysts who are online", async () => {
    const database = await emptyDatabase();
    await addAnalyst(database, "analyst-1", "online");
    await addAnalyst(database, "analyst-2", "online");
    await addAnalyst(database, "analyst-3", "busy");
    await addAnalyst(database, "analyst-4", "offline");

    expect((await statsOf(database)).analystsOnline).toBe(2);
  });

  it("drops when an analyst goes away", async () => {
    const database = await emptyDatabase();
    await addAnalyst(database, "analyst-1", "online");
    const before = (await statsOf(database)).analystsOnline;

    await database
      .update(employees)
      .set({ availability: "busy" })
      .where(eq(employees.id, "analyst-1"));

    expect([before, (await statsOf(database)).analystsOnline]).toEqual([1, 0]);
  });
});

describe("loginStats: seed data", () => {
  it("gives plausible numbers for the demo", async () => {
    const stats = await statsOf(await createSeededDatabase());

    expect(stats).toEqual({
      firstResponseSeconds: 8,
      resolvedWithoutQueuePercent: 63,
      analystsOnline: 1,
    });
  });
});
