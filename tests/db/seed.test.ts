import { and, count, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { conversations, drafts, employees, helpArticles, tickets } from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";
import { isOverdue } from "../../src/domain/sla";
import { createSeededDatabase } from "../support/database";

const SEED_NOW = new Date("2026-10-28T09:43:00-03:00");
const ANA_ID = "emp-ana";

describe("seed", () => {
  it("is idempotent", async () => {
    const database = await createSeededDatabase();
    await seedDatabase(database);

    const [total] = await database.select({ value: count() }).from(tickets);

    expect(total?.value).toBe(8);
  });

  it("gives Ana 3 open and 2 closed tickets", async () => {
    const database = await createSeededDatabase();
    const rows = await database
      .select({ status: tickets.status })
      .from(tickets)
      .where(eq(tickets.ownerId, ANA_ID));
    const closed = rows.filter((row) => row.status === "resolved");

    expect(rows.length - closed.length).toBe(3);
    expect(closed).toHaveLength(2);
  });

  it("keeps INC-20311 overdue at the prototype time", async () => {
    const database = await createSeededDatabase();
    const [ticket] = await database.select().from(tickets).where(eq(tickets.number, "INC-20311"));

    expect(ticket && isOverdue(ticket.dueAt, SEED_NOW)).toBe(true);
  });

  it("gives INC-20150 to Carla, resolved 4 days before the prototype time", async () => {
    const database = await createSeededDatabase();
    const [ticket] = await database.select().from(tickets).where(eq(tickets.number, "INC-20150"));

    expect(ticket?.ownerId).toBe("emp-carla");
    expect(ticket?.status).toBe("resolved");
    expect(ticket?.resolvedAt?.toISOString()).toBe(
      new Date("2026-10-24T11:20:00-03:00").toISOString(),
    );
  });

  it("seeds the pending draft D-381", async () => {
    const database = await createSeededDatabase();
    const [draft] = await database
      .select()
      .from(drafts)
      .where(and(eq(drafts.id, "D-381"), eq(drafts.status, "pending")));

    expect(draft?.mode).toBe("create");
  });

  it("seeds conversations in every state the console lists", async () => {
    const database = await createSeededDatabase();
    const rows = await database.select({ mode: conversations.mode }).from(conversations);
    const modes = new Set(rows.map((row) => row.mode));

    expect([...modes].sort()).toEqual(["agent", "awaiting_analyst", "closed"]);
  });

  it("seeds two analysts, between 5 and 10 articles and the VPN article", async () => {
    const database = await createSeededDatabase();
    const analysts = await database.select().from(employees).where(eq(employees.role, "analyst"));
    const articles = await database.select().from(helpArticles);

    expect(analysts.map((analyst) => analyst.level)).toEqual(["N2", "N1"]);
    expect(articles.length).toBeGreaterThanOrEqual(5);
    expect(articles.length).toBeLessThanOrEqual(10);
    expect(articles.map((article) => article.id)).toContain("kb-vpn-809");
  });
});
