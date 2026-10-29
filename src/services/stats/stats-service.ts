import { and, count, eq, exists, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../../db/client";
import { conversations, employees, messages } from "../../db/schema";
import type { Clock } from "../../lib/clock";

const WINDOW_DAYS = 30;
const MS_PER_DAY = 86_400_000;
const MS_PER_SECOND = 1000;
const PERCENT = 100;

export interface StatsServiceDeps {
  readonly database: Database;
  readonly clock: Clock;
}

export interface LoginStats {
  readonly firstResponseSeconds: number | null;
  readonly resolvedWithoutQueuePercent: number | null;
  readonly analystsOnline: number;
}

const averageRowsSchema = z.array(z.object({ averageMs: z.number().nullable() }));

const windowStart = ({ clock }: Pick<StatsServiceDeps, "clock">): Date =>
  new Date(clock.now().getTime() - WINDOW_DAYS * MS_PER_DAY);

const countAnalystsOnline = async ({ database }: StatsServiceDeps): Promise<number> => {
  const [row] = await database
    .select({ total: count() })
    .from(employees)
    .where(and(eq(employees.role, "analyst"), eq(employees.availability, "online")));

  return row?.total ?? 0;
};

const percentWithoutQueue = async (deps: StatsServiceDeps): Promise<number | null> => {
  const answeredByAgent = exists(
    deps.database
      .select({ one: sql`1` })
      .from(messages)
      .where(and(eq(messages.conversationId, conversations.id), eq(messages.authorKind, "agent"))),
  );
  const [row] = await deps.database
    .select({
      total: count(),
      withoutQueue: sql<number>`coalesce(sum(case when ${conversations.handoffReason} is null then 1 else 0 end), 0)`,
    })
    .from(conversations)
    .where(and(gte(conversations.createdAt, windowStart(deps)), answeredByAgent));

  return row && row.total > 0 ? Math.round((row.withoutQueue / row.total) * PERCENT) : null;
};

const averageFirstResponseSeconds = async (deps: StatsServiceDeps): Promise<number | null> => {
  const since = windowStart(deps).getTime();
  const rows = averageRowsSchema.parse(
    await deps.database.all(sql`
      select avg(agent.firstAt - employee.firstAt) as averageMs
      from (
        select conversation_id, min(created_at) as firstAt
        from messages
        where author_kind = 'employee' and created_at >= ${since}
        group by conversation_id
      ) as employee
      join (
        select conversation_id, min(created_at) as firstAt
        from messages
        where author_kind = 'agent'
        group by conversation_id
      ) as agent on agent.conversation_id = employee.conversation_id
      where agent.firstAt >= employee.firstAt
    `),
  );
  const averageMs = rows[0]?.averageMs ?? null;

  return averageMs === null ? null : Math.round(averageMs / MS_PER_SECOND);
};

export const getLoginStats = async (deps: StatsServiceDeps): Promise<LoginStats> => {
  const [firstResponseSeconds, resolvedWithoutQueuePercent, analystsOnline] = await Promise.all([
    averageFirstResponseSeconds(deps),
    percentWithoutQueue(deps),
    countAnalystsOnline(deps),
  ]);

  return { firstResponseSeconds, resolvedWithoutQueuePercent, analystsOnline };
};

export const createStatsService = (deps: StatsServiceDeps) => ({
  loginStats: () => getLoginStats(deps),
});

export type StatsService = ReturnType<typeof createStatsService>;
