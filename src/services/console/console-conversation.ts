import { desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { Database } from "../../db/client";
import { conversations, employees, messages, tickets } from "../../db/schema";
import type { ConversationMode, MessageAuthorKind } from "../../domain/conversation";
import type { AnalystLevel } from "../../domain/employee";
import { ConversationNotFoundError } from "../../domain/errors";
import type { EventPublisher } from "../../domain/realtime";
import type { TicketPriority } from "../../domain/sla";
import type { TicketStatus } from "../../domain/ticket";
import type { UsageSummary } from "../../domain/usage";
import type { Clock } from "../../lib/clock";
import { requireAnalyst } from "../analysts/require-analyst";
import { announceConversation } from "../conversations/announcements";
import { conversationUsage } from "../usage/usage-service";

const MAX_CONVERSATION_MESSAGES = 200;

export interface ConsoleConversationDeps {
  readonly database: Database;
  readonly clock: Clock;
  readonly events?: EventPublisher;
  readonly presence?: { readonly isOnline: (userId: string) => boolean };
}

export interface ConsoleMessage {
  readonly id: string;
  readonly authorKind: MessageAuthorKind;
  readonly authorName: string | null;
  readonly authorLevel: AnalystLevel | null;
  readonly content: string;
  readonly createdAt: Date;
  readonly readByEmployee: boolean | null;
}

export interface ConsoleConversation {
  readonly id: string;
  readonly viewerId: string;
  readonly employee: { readonly id: string; readonly name: string; readonly department: string };
  readonly employeeOnline: boolean;
  readonly mode: ConversationMode;
  readonly handoffLevel: AnalystLevel | null;
  readonly handoffReason: string | null;
  readonly handoffSummary: string | null;
  readonly contactDueAt: Date | null;
  readonly ticket: {
    readonly number: string;
    readonly title: string;
    readonly status: TicketStatus;
    readonly priority: TicketPriority;
  } | null;
  readonly assignedAnalyst: {
    readonly id: string;
    readonly name: string;
    readonly level: AnalystLevel | null;
  } | null;
  readonly messages: readonly ConsoleMessage[];
  readonly usage: UsageSummary;
}

const assignee = alias(employees, "assignee");

const selectConversation = (database: Database, conversationId: string) =>
  database
    .select({
      conversation: conversations,
      employee: { id: employees.id, name: employees.name, department: employees.department },
      ticket: {
        number: tickets.number,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
      },
      assignee: { id: assignee.id, name: assignee.name, level: assignee.level },
    })
    .from(conversations)
    .innerJoin(employees, eq(conversations.employeeId, employees.id))
    .leftJoin(tickets, eq(conversations.ticketId, tickets.id))
    .leftJoin(assignee, eq(conversations.assignedAnalystId, assignee.id))
    .where(eq(conversations.id, conversationId));

const loadMessages = async (database: Database, conversationId: string) => {
  const rows = await database
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(MAX_CONVERSATION_MESSAGES);

  return rows.reverse();
};

const loadAuthors = async (
  database: Database,
  authorIds: readonly string[],
): Promise<ReadonlyMap<string, { name: string; level: AnalystLevel | null }>> => {
  if (authorIds.length === 0) {
    return new Map();
  }

  const rows = await database
    .select({ id: employees.id, name: employees.name, level: employees.level })
    .from(employees)
    .where(inArray(employees.id, authorIds));

  return new Map(rows.map(({ id, name, level }) => [id, { name, level }]));
};

type MessageRow = Awaited<ReturnType<typeof loadMessages>>[number];

const toConsoleMessage = (
  row: MessageRow,
  authors: Awaited<ReturnType<typeof loadAuthors>>,
  lastEmployeeAt: number,
): ConsoleMessage => {
  const author =
    row.authorKind === "analyst" && row.authorId ? authors.get(row.authorId) : undefined;

  return {
    id: row.id,
    authorKind: row.authorKind,
    authorName: author?.name ?? null,
    authorLevel: author?.level ?? null,
    content: row.content,
    createdAt: row.createdAt,
    readByEmployee: row.authorKind === "analyst" ? lastEmployeeAt > row.createdAt.getTime() : null,
  };
};

export const getConsoleConversation = async (
  { database, presence }: ConsoleConversationDeps,
  analystId: string,
  conversationId: string,
): Promise<ConsoleConversation> => {
  await requireAnalyst(database, analystId);

  const [row] = await selectConversation(database, conversationId);

  if (!row) {
    throw new ConversationNotFoundError(conversationId);
  }

  const rows = await loadMessages(database, conversationId);
  const usage = await conversationUsage({ database }, conversationId);
  const analystIds = rows.flatMap((message) => (message.authorId ? [message.authorId] : []));
  const authors = await loadAuthors(database, [...new Set(analystIds)]);
  const lastEmployeeAt = Math.max(
    0,
    ...rows
      .filter((message) => message.authorKind === "employee")
      .map((m) => m.createdAt.getTime()),
  );
  const { conversation } = row;

  return {
    id: conversation.id,
    viewerId: analystId,
    employee: row.employee,
    employeeOnline: presence?.isOnline(row.employee.id) ?? false,
    mode: conversation.mode,
    handoffLevel: conversation.handoffLevel,
    handoffReason: conversation.handoffReason,
    handoffSummary: conversation.handoffSummary,
    contactDueAt: conversation.contactDueAt,
    ticket: row.ticket,
    assignedAnalyst: row.assignee,
    messages: rows.map((message) => toConsoleMessage(message, authors, lastEmployeeAt)),
    usage,
  };
};

export const markConversationRead = async (
  deps: ConsoleConversationDeps,
  analystId: string,
  conversationId: string,
): Promise<void> => {
  await requireAnalyst(deps.database, analystId);

  const [conversation] = await deps.database
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conversation) {
    throw new ConversationNotFoundError(conversationId);
  }

  const readAt = deps.clock.now();

  await deps.database
    .update(conversations)
    .set({ analystReadAt: readAt })
    .where(eq(conversations.id, conversationId));
  announceConversation(deps, { ...conversation, analystReadAt: readAt });
};
