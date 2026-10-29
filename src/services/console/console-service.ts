import { type AnyColumn, and, asc, eq, exists, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { Database } from "../../db/client";
import { conversations, employees, messages, tickets } from "../../db/schema";
import {
  type AnalystAvailability,
  type ConsoleFilter,
  type ConsoleLabel,
  labelOf,
} from "../../domain/console";
import type { ConversationMode } from "../../domain/conversation";
import type { AnalystLevel } from "../../domain/employee";
import { requireAnalyst } from "../analysts/require-analyst";
import { oldestFirstWhenWaiting, queueOrder } from "../handoff/handoff-service";
import {
  type ConsoleCounts,
  countConversations,
  lastConfidences,
  lastMessages,
  type MessagePreview,
  unreadCounts,
} from "./console-queries";

const DEFAULT_LIST_LIMIT = 50;
const AWAITING_MODE = "awaiting_analyst";
const WITH_ANALYST_MODE = "with_analyst";

export interface ConsoleServiceDeps {
  readonly database: Database;
}

export interface ConsoleListOptions {
  readonly filter?: ConsoleFilter;
  readonly query?: string;
}

export interface ConsoleItem {
  readonly id: string;
  readonly employee: { readonly id: string; readonly name: string; readonly department: string };
  readonly mode: ConversationMode;
  readonly assignedAnalystId: string | null;
  readonly ticketNumber: string | null;
  readonly contactDueAt: Date | null;
  readonly updatedAt: Date;
  readonly preview: MessagePreview | null;
  readonly unread: number;
  readonly label: ConsoleLabel;
}

export interface ConsoleOverview {
  readonly me: {
    readonly id: string;
    readonly name: string;
    readonly level: AnalystLevel | null;
    readonly availability: AnalystAvailability;
  };
  readonly items: readonly ConsoleItem[];
  readonly counts: ConsoleCounts;
  readonly attention: number;
}

const assignee = alias(employees, "assignee");

const FILTER_CLAUSES: Readonly<Record<ConsoleFilter, (analystId: string) => SQL | undefined>> = {
  all: () => undefined,
  for_you: () => eq(conversations.mode, AWAITING_MODE),
  with_agent: () => eq(conversations.mode, "agent"),
  mine: (analystId) =>
    and(eq(conversations.mode, WITH_ANALYST_MODE), eq(conversations.assignedAnalystId, analystId)),
};

const escapeLike = (term: string): string => term.replace(/[\\%_]/g, (char) => `\\${char}`);

const likeEscaped = (column: AnyColumn, pattern: string): SQL =>
  sql`${column} like ${pattern} escape '\\'`;

const searchClauseOf = (query: string): SQL | undefined => {
  const term = query.trim();

  if (term === "") {
    return undefined;
  }

  const pattern = `%${escapeLike(term)}%`;
  const messageMatch = exists(
    sql`(select 1 from ${messages} where ${messages.conversationId} = ${conversations.id} and ${likeEscaped(messages.content, pattern)})`,
  );

  return sql`(${likeEscaped(employees.name, pattern)} or ${likeEscaped(tickets.number, pattern)} or ${messageMatch})`;
};

const selectRows = (database: Database, analystId: string, options: ConsoleListOptions) =>
  database
    .select({
      conversation: conversations,
      employee: { id: employees.id, name: employees.name, department: employees.department },
      ticketNumber: tickets.number,
      assigneeName: assignee.name,
    })
    .from(conversations)
    .innerJoin(employees, eq(conversations.employeeId, employees.id))
    .leftJoin(tickets, eq(conversations.ticketId, tickets.id))
    .leftJoin(assignee, eq(conversations.assignedAnalystId, assignee.id))
    .where(
      and(FILTER_CLAUSES[options.filter ?? "all"](analystId), searchClauseOf(options.query ?? "")),
    )
    .orderBy(asc(queueOrder), asc(oldestFirstWhenWaiting))
    .limit(DEFAULT_LIST_LIMIT);

type Row = Awaited<ReturnType<typeof selectRows>>[number];

interface ItemContext {
  readonly analystId: string;
  readonly previews: ReadonlyMap<string, MessagePreview>;
  readonly unread: ReadonlyMap<string, number>;
  readonly confidences: ReadonlyMap<string, number>;
}

const unreadOf = (row: Row, unread: ReadonlyMap<string, number>): number =>
  row.conversation.mode === AWAITING_MODE || row.conversation.mode === WITH_ANALYST_MODE
    ? (unread.get(row.conversation.id) ?? 0)
    : 0;

const toItem = (row: Row, context: ItemContext): ConsoleItem => {
  const { conversation } = row;

  return {
    id: conversation.id,
    employee: row.employee,
    mode: conversation.mode,
    assignedAnalystId: conversation.assignedAnalystId,
    ticketNumber: row.ticketNumber,
    contactDueAt: conversation.contactDueAt,
    updatedAt: conversation.updatedAt,
    preview: context.previews.get(conversation.id) ?? null,
    unread: unreadOf(row, context.unread),
    label: labelOf({
      mode: conversation.mode,
      assignedAnalystId: conversation.assignedAnalystId,
      assignedAnalystName: row.assigneeName,
      viewerId: context.analystId,
      handoffReason: conversation.handoffReason,
      ticketNumber: row.ticketNumber,
      contactDueAt: conversation.contactDueAt,
      lastConfidence: context.confidences.get(conversation.id) ?? null,
    }),
  };
};

const idsOf = (rows: readonly Row[], mode: ConversationMode): string[] =>
  rows.filter((row) => row.conversation.mode === mode).map((row) => row.conversation.id);

const loadMineIds = async (database: Database, analystId: string): Promise<string[]> => {
  const rows = await database
    .select({ id: conversations.id })
    .from(conversations)
    .where(FILTER_CLAUSES.mine(analystId));

  return rows.map((row) => row.id);
};

const attentionOf = async (
  database: Database,
  analystId: string,
  counts: ConsoleCounts,
): Promise<number> => {
  const mineIds = await loadMineIds(database, analystId);
  const unread = await unreadCounts(database, mineIds);

  return counts.forYou + mineIds.filter((id) => (unread.get(id) ?? 0) > 0).length;
};

export const listConversations = async (
  { database }: ConsoleServiceDeps,
  analystId: string,
  options: ConsoleListOptions = {},
): Promise<ConsoleOverview> => {
  const analyst = await requireAnalyst(database, analystId);
  const rows = await selectRows(database, analystId, options);
  const ids = rows.map((row) => row.conversation.id);
  const [counts, previews, unread, confidences] = await Promise.all([
    countConversations(database, analystId),
    lastMessages(database, ids),
    unreadCounts(database, ids),
    lastConfidences(database, idsOf(rows, AWAITING_MODE)),
  ]);

  return {
    me: {
      id: analyst.id,
      name: analyst.name,
      level: analyst.level,
      availability: analyst.availability === "online" ? "online" : "offline",
    },
    items: rows.map((row) => toItem(row, { analystId, previews, unread, confidences })),
    counts,
    attention: await attentionOf(database, analystId, counts),
  };
};

export const setAvailability = async (
  { database }: ConsoleServiceDeps,
  analystId: string,
  availability: AnalystAvailability,
): Promise<AnalystAvailability> => {
  await requireAnalyst(database, analystId);
  await database.update(employees).set({ availability }).where(eq(employees.id, analystId));

  return availability;
};

export const createConsoleService = (deps: ConsoleServiceDeps) => ({
  list: (analystId: string, options?: ConsoleListOptions) =>
    listConversations(deps, analystId, options),
  setAvailability: (analystId: string, availability: AnalystAvailability) =>
    setAvailability(deps, analystId, availability),
});

export type ConsoleService = ReturnType<typeof createConsoleService>;
