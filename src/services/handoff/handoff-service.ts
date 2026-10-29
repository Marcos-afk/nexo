import { asc, eq, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { conversations, employees, tickets } from "../../db/schema";
import type { ConversationMode } from "../../domain/conversation";
import {
  ConversationAssignedToOtherError,
  ConversationNotFoundError,
  InvalidConversationTransitionError,
} from "../../domain/errors";
import {
  assumedMessage,
  closedMessage,
  type HandoffAction,
  type HandoffInput,
  nextConversationMode,
  returnedMessage,
  transferredMessage,
} from "../../domain/handoff";
import { computeContactDueAt } from "../../domain/sla";
import { isClosed } from "../../domain/ticket-rules";
import { requireAnalyst } from "../analysts/require-analyst";
import { announceConversation, announceMessage } from "../conversations/announcements";
import {
  type Conversation,
  type ConversationServiceDeps,
  getActiveConversation,
  insertMessage,
  type Message,
} from "../conversations/conversation-service";
import { SESSION_MESSAGE_LIMIT } from "../conversations/history";
import type { LegacyGuard } from "../tickets/legacy-guard";
import { createTicketService } from "../tickets/ticket-service";

export interface HandoffServiceDeps extends ConversationServiceDeps {
  readonly legacy?: LegacyGuard;
}

export interface QueueItem {
  readonly conversation: Conversation;
  readonly employeeName: string;
}

export interface QueueOptions {
  readonly mode?: ConversationMode;
  readonly limit?: number;
}

const DEFAULT_QUEUE_LIMIT = 50;
const MAX_QUEUE_LIMIT = 100;

const queueOrder = sql`case when ${conversations.mode} = 'awaiting_analyst' then 0 else 1 end`;
const oldestFirstWhenWaiting = sql`case when ${conversations.mode} = 'awaiting_analyst' then ${conversations.updatedAt} else -${conversations.updatedAt} end`;

const requireConversation = async (
  executor: Pick<Database, "select">,
  conversationId: string,
): Promise<Conversation> => {
  const [conversation] = await executor
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conversation) {
    throw new ConversationNotFoundError(conversationId);
  }

  return conversation;
};

const targetMode = (conversation: Conversation, action: HandoffAction): ConversationMode => {
  const mode = nextConversationMode(conversation.mode, action);

  if (!mode) {
    throw new InvalidConversationTransitionError(conversation.id, conversation.mode, action);
  }

  return mode;
};

const requireAssignment = (conversation: Conversation, analystId: string): void => {
  const assignee = conversation.assignedAnalystId;

  if (assignee !== null && assignee !== analystId) {
    throw new ConversationAssignedToOtherError(conversation.id);
  }
};

const requireOwnedConversation = async (
  database: Database,
  ownerId: string,
  conversationId: string,
): Promise<Conversation> => {
  const conversation = await requireConversation(database, conversationId);

  if (conversation.employeeId !== ownerId) {
    throw new ConversationNotFoundError(conversationId);
  }

  return conversation;
};

const applyTransition = async (
  deps: HandoffServiceDeps,
  updated: Conversation,
  content: string,
): Promise<void> => {
  const message = await deps.database.transaction(async (transaction) => {
    await transaction.update(conversations).set(updated).where(eq(conversations.id, updated.id));

    return insertMessage(transaction, deps, {
      conversationId: updated.id,
      authorKind: "system",
      authorId: null,
      content,
    });
  });

  announceMessage(deps, updated.employeeId, message);
  announceConversation(deps, updated);
};

const assumeLinkedTicket = async (
  deps: HandoffServiceDeps,
  analystId: string,
  ticketId: string | null,
): Promise<void> => {
  if (ticketId === null) {
    return;
  }

  const [ticket] = await deps.database
    .select({ status: tickets.status })
    .from(tickets)
    .where(eq(tickets.id, ticketId));

  if (ticket && !isClosed(ticket.status)) {
    await createTicketService(deps).assume(analystId, ticketId);
  }
};

export const requestHandoff = async (
  deps: HandoffServiceDeps,
  ownerId: string,
  conversationId: string,
  input: HandoffInput,
): Promise<Conversation> => {
  const conversation = await requireOwnedConversation(deps.database, ownerId, conversationId);
  const mode = targetMode(conversation, "transfer");
  const now = deps.clock.now();
  const ticket = input.ticketNumber
    ? await createTicketService(deps).transferToAnalyst(
        { ownerId, number: input.ticketNumber },
        input.reason,
      )
    : null;
  const updated: Conversation = {
    ...conversation,
    mode,
    handoffReason: input.reason,
    handoffSummary: input.summary,
    contactDueAt: computeContactDueAt(input.urgency, now),
    ticketId: ticket?.id ?? conversation.ticketId,
    updatedAt: now,
  };

  await applyTransition(deps, updated, transferredMessage);

  return updated;
};

const LIMIT_HANDOFF_INPUT: HandoffInput = {
  reason: "Limite de mensagens da sessão atingido",
  summary: `O funcionário atingiu o limite de ${SESSION_MESSAGE_LIMIT} mensagens da sessão e pediu um analista para continuar.`,
  urgency: "normal",
};

export const requestHandoffOnLimit = async (
  deps: HandoffServiceDeps,
  ownerId: string,
): Promise<Conversation> => {
  const conversation = await getActiveConversation(deps, ownerId);

  if (!conversation) {
    throw new ConversationNotFoundError(ownerId);
  }

  return requestHandoff(deps, ownerId, conversation.id, LIMIT_HANDOFF_INPUT);
};

export const assumeConversation = async (
  deps: HandoffServiceDeps,
  analystId: string,
  conversationId: string,
): Promise<Conversation> => {
  const analyst = await requireAnalyst(deps.database, analystId);
  const conversation = await requireConversation(deps.database, conversationId);
  const mode = targetMode(conversation, "assume");

  await assumeLinkedTicket(deps, analyst.id, conversation.ticketId);

  const updated: Conversation = {
    ...conversation,
    mode,
    assignedAnalystId: analyst.id,
    updatedAt: deps.clock.now(),
  };

  await applyTransition(deps, updated, assumedMessage(analyst.name));

  return updated;
};

const releaseConversation = async (
  deps: HandoffServiceDeps,
  analystId: string,
  conversationId: string,
  action: "return" | "close",
): Promise<Conversation> => {
  await requireAnalyst(deps.database, analystId);
  const conversation = await requireConversation(deps.database, conversationId);

  requireAssignment(conversation, analystId);

  const mode = targetMode(conversation, action);
  const updated: Conversation = {
    ...conversation,
    mode,
    assignedAnalystId: null,
    contactDueAt: null,
    updatedAt: deps.clock.now(),
  };

  await applyTransition(deps, updated, action === "return" ? returnedMessage : closedMessage);

  return updated;
};

export const returnToAgent = (
  deps: HandoffServiceDeps,
  analystId: string,
  conversationId: string,
): Promise<Conversation> => releaseConversation(deps, analystId, conversationId, "return");

export const closeAttendance = (
  deps: HandoffServiceDeps,
  analystId: string,
  conversationId: string,
): Promise<Conversation> => releaseConversation(deps, analystId, conversationId, "close");

export const sendAnalystMessage = async (
  deps: HandoffServiceDeps,
  analystId: string,
  conversationId: string,
  content: string,
): Promise<Message> => {
  await requireAnalyst(deps.database, analystId);
  const conversation = await requireConversation(deps.database, conversationId);

  targetMode(conversation, "reply");
  requireAssignment(conversation, analystId);

  const message = await insertMessage(deps.database, deps, {
    conversationId,
    authorKind: "analyst",
    authorId: analystId,
    content,
  });

  announceMessage(deps, conversation.employeeId, message);

  return message;
};

export const listQueue = async (
  { database }: HandoffServiceDeps,
  analystId: string,
  { mode, limit = DEFAULT_QUEUE_LIMIT }: QueueOptions = {},
): Promise<readonly QueueItem[]> => {
  await requireAnalyst(database, analystId);

  const rows = await database
    .select({ conversation: conversations, employeeName: employees.name })
    .from(conversations)
    .innerJoin(employees, eq(conversations.employeeId, employees.id))
    .where(mode ? eq(conversations.mode, mode) : undefined)
    .orderBy(asc(queueOrder), asc(oldestFirstWhenWaiting))
    .limit(Math.min(limit, MAX_QUEUE_LIMIT));

  return rows;
};

export const createHandoffService = (deps: HandoffServiceDeps) => ({
  request: (ownerId: string, conversationId: string, input: HandoffInput) =>
    requestHandoff(deps, ownerId, conversationId, input),
  requestOnLimit: (ownerId: string) => requestHandoffOnLimit(deps, ownerId),
  listQueue: (analystId: string, options?: QueueOptions) => listQueue(deps, analystId, options),
  assume: (analystId: string, conversationId: string) =>
    assumeConversation(deps, analystId, conversationId),
  returnToAgent: (analystId: string, conversationId: string) =>
    returnToAgent(deps, analystId, conversationId),
  close: (analystId: string, conversationId: string) =>
    closeAttendance(deps, analystId, conversationId),
  reply: (analystId: string, conversationId: string, content: string) =>
    sendAnalystMessage(deps, analystId, conversationId, content),
});

export type HandoffService = ReturnType<typeof createHandoffService>;
