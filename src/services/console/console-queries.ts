import { and, count, desc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { conversations, decisions, messages } from "../../db/schema";
import type { MessageAuthorKind } from "../../domain/conversation";

const PREVIEW_LENGTH = 140;

export interface MessagePreview {
  readonly text: string;
  readonly authorKind: MessageAuthorKind;
  readonly at: Date;
}

export interface ConsoleCounts {
  readonly all: number;
  readonly forYou: number;
  readonly withAgent: number;
  readonly mine: number;
}

const sumWhen = (condition: ReturnType<typeof sql>) =>
  sql<number>`coalesce(sum(case when ${condition} then 1 else 0 end), 0)`;

export const countConversations = async (
  database: Database,
  analystId: string,
): Promise<ConsoleCounts> => {
  const [row] = await database
    .select({
      all: count(),
      forYou: sumWhen(sql`${conversations.mode} = 'awaiting_analyst'`),
      withAgent: sumWhen(sql`${conversations.mode} = 'agent'`),
      mine: sumWhen(
        sql`${conversations.mode} = 'with_analyst' and ${conversations.assignedAnalystId} = ${analystId}`,
      ),
    })
    .from(conversations);

  return row ?? { all: 0, forYou: 0, withAgent: 0, mine: 0 };
};

export const lastMessages = async (
  database: Database,
  ids: readonly string[],
): Promise<ReadonlyMap<string, MessagePreview>> => {
  if (ids.length === 0) {
    return new Map();
  }

  const rows = await database
    .select({
      conversationId: messages.conversationId,
      text: messages.content,
      authorKind: messages.authorKind,
      at: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, ids),
        sql`${messages.createdAt} = (select max(m.created_at) from messages m where m.conversation_id = ${messages.conversationId})`,
      ),
    );

  return new Map(
    rows.map(({ conversationId, text, authorKind, at }) => [
      conversationId,
      { text: text.slice(0, PREVIEW_LENGTH), authorKind, at },
    ]),
  );
};

export const unreadCounts = async (
  database: Database,
  ids: readonly string[],
): Promise<ReadonlyMap<string, number>> => {
  if (ids.length === 0) {
    return new Map();
  }

  const rows = await database
    .select({ conversationId: messages.conversationId, unread: count() })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, ids),
        eq(messages.authorKind, "employee"),
        gt(
          messages.createdAt,
          sql`coalesce((select max(m.created_at) from messages m where m.conversation_id = ${messages.conversationId} and m.author_kind <> 'employee'), 0)`,
        ),
      ),
    )
    .groupBy(messages.conversationId);

  return new Map(rows.map(({ conversationId, unread }) => [conversationId, unread]));
};

export const lastConfidences = async (
  database: Database,
  ids: readonly string[],
): Promise<ReadonlyMap<string, number>> => {
  if (ids.length === 0) {
    return new Map();
  }

  const rows = await database
    .select({ conversationId: messages.conversationId, confidence: decisions.confidence })
    .from(decisions)
    .innerJoin(messages, eq(decisions.messageId, messages.id))
    .where(inArray(messages.conversationId, ids))
    .orderBy(desc(messages.createdAt));

  return new Map(
    [...rows].reverse().map(({ conversationId, confidence }) => [conversationId, confidence]),
  );
};
