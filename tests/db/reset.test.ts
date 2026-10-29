import { count, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDatabase, migrateDatabase } from "../../src/db/client";
import { assertResettable, resetDatabase } from "../../src/db/reset";
import { drafts, employees, sessions, tickets } from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";
import { DatabaseResetBlockedError } from "../../src/domain/errors";
import { createSeededDatabase } from "../support/database";

const IN_MEMORY_URL = ":memory:";
const SEEDED_DRAFT = "D-381";
const SEEDED_TICKETS = 8;
const SEEDED_EMPLOYEES = 9;

const rebuild = async (database: Awaited<ReturnType<typeof createSeededDatabase>>) => {
  await resetDatabase(database);
  await migrateDatabase(database);
  await seedDatabase(database);
};

const tableNames = async (database: Awaited<ReturnType<typeof createSeededDatabase>>) =>
  (await database.all<{ name: string }>(sql`select name from sqlite_master where type = 'table'`))
    .map(({ name }) => name)
    .toSorted();

describe("resetDatabase", () => {
  it("brings back the seed after the data was changed", async () => {
    const database = await createSeededDatabase();
    await database.update(drafts).set({ status: "confirmed" }).where(eq(drafts.id, SEEDED_DRAFT));
    await database.insert(sessions).values({
      id: "s-1",
      employeeId: "emp-ana",
      remember: true,
      userMessageCount: 0,
      createdAt: new Date(),
      expiresAt: new Date(),
    });
    await database
      .update(tickets)
      .set({ title: "Título alterado" })
      .where(eq(tickets.number, "INC-20311"));

    await rebuild(database);

    const [draft] = await database.select().from(drafts).where(eq(drafts.id, SEEDED_DRAFT));
    const [sessionCount] = await database.select({ value: count() }).from(sessions);
    const [ticket] = await database.select().from(tickets).where(eq(tickets.number, "INC-20311"));
    const [ticketCount] = await database.select({ value: count() }).from(tickets);
    const [employeeCount] = await database.select({ value: count() }).from(employees);

    expect(draft?.status).toBe("pending");
    expect(sessionCount?.value).toBe(0);
    expect(ticket?.title).toBe("Notebook lento após atualização do Windows");
    expect(ticketCount?.value).toBe(SEEDED_TICKETS);
    expect(employeeCount?.value).toBe(SEEDED_EMPLOYEES);
  });

  it("leaves exactly the tables of the schema, dropping any leftover", async () => {
    const database = await createSeededDatabase();
    const expected = await tableNames(database);
    await database.run(sql`create table leftover_from_old_schema (id text primary key)`);

    await rebuild(database);

    expect(await tableNames(database)).toEqual(expected);
  });

  it("works on a database that was only migrated", async () => {
    const database = createDatabase(IN_MEMORY_URL);
    await migrateDatabase(database);

    await rebuild(database);

    const [ticketCount] = await database.select({ value: count() }).from(tickets);

    expect(ticketCount?.value).toBe(SEEDED_TICKETS);
  });
});

describe("assertResettable", () => {
  it.each(["development", "test"])("allows %s", (nodeEnv) => {
    expect(() => assertResettable(nodeEnv)).not.toThrow();
  });

  it("blocks production", () => {
    expect(() => assertResettable("production")).toThrow(DatabaseResetBlockedError);
  });
});
