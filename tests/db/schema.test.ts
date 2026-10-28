import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDatabase, migrateDatabase } from "../../src/db/client";
import { employees, helpArticles, tickets } from "../../src/db/schema";

const IN_MEMORY_URL = ":memory:";
const EXPECTED_TABLES = [
  "conversations",
  "decisions",
  "drafts",
  "employees",
  "help_articles",
  "messages",
  "sessions",
  "ticket_events",
  "tickets",
];

const createdAt = new Date("2026-10-16T14:20:00-03:00");

const ana = {
  id: "emp-ana",
  name: "Ana Souza",
  email: "ana.souza@nexo.test",
  department: "Financeiro",
  role: "employee",
} as const;

const buildTicket = (id: string, number: string) =>
  ({
    id,
    number,
    type: "incident",
    category: "Hardware",
    title: "Notebook lento após atualização do Windows",
    description: "Lento depois da atualização.",
    priority: "medium",
    status: "open",
    ownerId: ana.id,
    createdAt,
    updatedAt: createdAt,
    dueAt: new Date("2026-10-21T14:20:00-03:00"),
  }) as const;

const createMigratedDatabase = async () => {
  const database = createDatabase(IN_MEMORY_URL);
  await migrateDatabase(database);

  return database;
};

describe("database schema", () => {
  it("creates every table from the migrations", async () => {
    const database = await createMigratedDatabase();
    const rows = await database.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '%drizzle%' order by name`,
    );

    expect(rows.map((row) => row.name)).toEqual(EXPECTED_TABLES);
  });

  it("rejects a second ticket with the same number", async () => {
    const database = await createMigratedDatabase();
    await database.insert(employees).values(ana);
    await database.insert(tickets).values(buildTicket("t-1", "INC-20311"));

    await expect(
      database.insert(tickets).values(buildTicket("t-2", "INC-20311")),
    ).rejects.toThrow();
  });

  it("rejects a ticket whose owner does not exist", async () => {
    const database = await createMigratedDatabase();
    await expect(
      database.insert(tickets).values(buildTicket("t-1", "INC-20311")),
    ).rejects.toThrow();
  });

  it("round-trips dates and JSON columns", async () => {
    const database = await createMigratedDatabase();
    await database.insert(employees).values(ana);
    await database.insert(tickets).values(buildTicket("t-1", "INC-20311"));
    await database.insert(helpArticles).values({
      id: "kb-1",
      title: "VPN erro 809",
      body: "Reinicie o cliente.",
      tags: ["vpn", "rede"],
      conditions: { windowsVersion: "11" },
    });

    const [ticket] = await database.select().from(tickets).where(eq(tickets.id, "t-1"));
    const [article] = await database.select().from(helpArticles).where(eq(helpArticles.id, "kb-1"));

    expect(ticket?.createdAt.toISOString()).toBe(createdAt.toISOString());
    expect(article?.tags).toEqual(["vpn", "rede"]);
    expect(article?.conditions).toEqual({ windowsVersion: "11" });
  });
});
