import { and, desc, eq, ne } from "drizzle-orm";
import type { Database } from "../../db/client";
import { conversations, messages } from "../../db/schema";
import type { MessageAuthorKind } from "../../domain/conversation";
import { ConversationClosedError, ConversationNotFoundError } from "../../domain/errors";
import type { Clock } from "../../lib/clock";
import type { IdGenerator } from "../../lib/ids";

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export interface ConversationServiceDeps {
  readonly database: Database;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export interface ConversationRef {
  readonly ownerId: string;
  readonly conversationId: string;
}

export interface AppendMessageInput {
  readonly authorKind: Exclude<MessageAuthorKind, "analyst">;
  readonly content: string;
  readonly parts?: unknown;
}

const DEFAULT_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LIMIT = 200;

const ownedBy = ({ ownerId, conversationId }: ConversationRef) =>
  and(eq(conversations.id, conversationId), eq(conversations.employeeId, ownerId));

const requireOwned = async (
  executor: Pick<Database, "select">,
  ref: ConversationRef,
): Promise<Conversation> => {
  const [conversation] = await executor.select().from(conversations).where(ownedBy(ref));

  if (!conversation) {
    throw new ConversationNotFoundError(ref.conversationId);
  }

  return conversation;
};

export const getActiveConversation = async (
  { database }: ConversationServiceDeps,
  ownerId: string,
): Promise<Conversation | null> => {
  const [conversation] = await database
    .select()
    .from(conversations)
    .where(and(eq(conversations.employeeId, ownerId), ne(conversations.mode, "closed")))
    .orderBy(desc(conversations.updatedAt))
    .limit(1);

  return conversation ?? null;
};

export const startConversation = async (
  { database, clock, ids }: ConversationServiceDeps,
  ownerId: string,
): Promise<Conversation> => {
  const now = clock.now();
  const conversation: Conversation = {
    id: ids.next(),
    employeeId: ownerId,
    mode: "agent",
    assignedAnalystId: null,
    handoffReason: null,
    handoffSummary: null,
    contactDueAt: null,
    ticketId: null,
    createdAt: now,
    updatedAt: now,
  };

  await database.insert(conversations).values(conversation);

  return conversation;
};

export const listMessages = async (
  { database }: ConversationServiceDeps,
  ref: ConversationRef,
  limit: number = DEFAULT_MESSAGE_LIMIT,
): Promise<readonly Message[]> => {
  await requireOwned(database, ref);

  const latest = await database
    .select()
    .from(messages)
    .where(eq(messages.conversationId, ref.conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(Math.min(limit, MAX_MESSAGE_LIMIT));

  return latest.toReversed();
};

export const appendMessage = (
  { database, clock, ids }: ConversationServiceDeps,
  ref: ConversationRef,
  input: AppendMessageInput,
): Promise<Message> =>
  database.transaction(async (transaction) => {
    const conversation = await requireOwned(transaction, ref);

    if (conversation.mode === "closed") {
      throw new ConversationClosedError(conversation.id);
    }

    const now = clock.now();
    const message: Message = {
      id: ids.next(),
      conversationId: conversation.id,
      authorKind: input.authorKind,
      authorId: input.authorKind === "employee" ? ref.ownerId : null,
      content: input.content,
      parts: input.parts ?? null,
      createdAt: now,
      deliveredAt: null,
      readAt: null,
    };

    await transaction.insert(messages).values(message);
    await transaction
      .update(conversations)
      .set({ updatedAt: now })
      .where(eq(conversations.id, conversation.id));

    return message;
  });

export const closeConversation = async (
  { database, clock }: ConversationServiceDeps,
  ref: ConversationRef,
): Promise<Conversation> => {
  const conversation = await requireOwned(database, ref);
  const closed: Conversation = { ...conversation, mode: "closed", updatedAt: clock.now() };

  await database
    .update(conversations)
    .set({ mode: closed.mode, updatedAt: closed.updatedAt })
    .where(eq(conversations.id, conversation.id));

  return closed;
};

export const createConversationService = (deps: ConversationServiceDeps) => ({
  getActive: (ownerId: string) => getActiveConversation(deps, ownerId),
  start: (ownerId: string) => startConversation(deps, ownerId),
  listMessages: (ref: ConversationRef, limit?: number) => listMessages(deps, ref, limit),
  appendMessage: (ref: ConversationRef, input: AppendMessageInput) =>
    appendMessage(deps, ref, input),
  close: (ref: ConversationRef) => closeConversation(deps, ref),
});

export type ConversationService = ReturnType<typeof createConversationService>;
