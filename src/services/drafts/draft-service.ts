import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { conversations, drafts, tickets } from "../../db/schema";
import type { DraftStatus } from "../../domain/conversation";
import {
  type DraftInput,
  draftPayloadOf,
  type StoredDraft,
  storedDraftSchema,
} from "../../domain/draft";
import {
  ConversationNotFoundError,
  DraftModeChangeError,
  DraftNotFoundError,
  DraftNotPendingError,
  DraftPayloadInvalidError,
  TicketNotFoundError,
} from "../../domain/errors";
import type { Ticket } from "../../domain/ticket";
import { createTicketService, type TicketServiceDeps } from "../tickets/ticket-service";

export type Draft = typeof drafts.$inferSelect;

export interface ConfirmedDraft {
  readonly draft: Draft;
  readonly ticket: Ticket;
}

const requireOwnedConversation = async (
  database: Database,
  ownerId: string,
  conversationId: string,
): Promise<void> => {
  const [conversation] = await database
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.employeeId, ownerId)));

  if (!conversation) {
    throw new ConversationNotFoundError(conversationId);
  }
};

const findTargetTicket = async (
  deps: TicketServiceDeps,
  ownerId: string,
  input: DraftInput,
): Promise<Ticket | null> => {
  if (input.mode === "create") {
    return null;
  }

  const ticket = await createTicketService(deps).get({ ownerId, number: input.ticketNumber });

  if (!ticket) {
    throw new TicketNotFoundError(input.ticketNumber);
  }

  return ticket;
};

const requireOwnedDraft = async (
  database: Database,
  ownerId: string,
  draftId: string,
): Promise<Draft> => {
  const [row] = await database
    .select({ draft: drafts })
    .from(drafts)
    .innerJoin(conversations, eq(drafts.conversationId, conversations.id))
    .where(and(eq(drafts.id, draftId), eq(conversations.employeeId, ownerId)));

  if (!row) {
    throw new DraftNotFoundError(draftId);
  }

  return row.draft;
};

type PendingChanges = Partial<Pick<Draft, "status" | "payload" | "targetTicketId">>;

const updatePending = async (
  database: Database,
  draftId: string,
  changes: PendingChanges,
): Promise<Draft> => {
  const [updated] = await database
    .update(drafts)
    .set(changes)
    .where(and(eq(drafts.id, draftId), eq(drafts.status, "pending")))
    .returning();

  if (updated) {
    return updated;
  }

  const [current] = await database
    .select({ status: drafts.status })
    .from(drafts)
    .where(eq(drafts.id, draftId));

  throw new DraftNotPendingError(draftId, current?.status ?? changes.status ?? "cancelled");
};

const moveFromPending = async (
  database: Database,
  draftId: string,
  status: DraftStatus,
): Promise<void> => {
  await updatePending(database, draftId, { status });
};

const parseStoredDraft = (draft: Draft): StoredDraft => {
  const parsed = storedDraftSchema.safeParse({ mode: draft.mode, payload: draft.payload });

  if (!parsed.success) {
    throw new DraftPayloadInvalidError(draft.id, { cause: parsed.error });
  }

  return parsed.data;
};

const requireTargetRef = async (deps: TicketServiceDeps, ownerId: string, draft: Draft) => {
  const [target] = draft.targetTicketId
    ? await deps.database
        .select({ number: tickets.number })
        .from(tickets)
        .where(and(eq(tickets.id, draft.targetTicketId), eq(tickets.ownerId, ownerId)))
    : [];

  if (!target) {
    throw new DraftPayloadInvalidError(draft.id);
  }

  return { ownerId, number: target.number };
};

const applyDraft = async (
  deps: TicketServiceDeps,
  ownerId: string,
  draft: Draft,
): Promise<Ticket> => {
  const stored = parseStoredDraft(draft);
  const ticketService = createTicketService(deps);

  if (stored.mode === "create") {
    return ticketService.create(ownerId, stored.payload);
  }

  const ref = await requireTargetRef(deps, ownerId, draft);

  return stored.mode === "update"
    ? ticketService.addNote(ref, stored.payload.note)
    : ticketService.reopen(ref);
};

const applyOrRelease = async (
  deps: TicketServiceDeps,
  ownerId: string,
  draft: Draft,
): Promise<Ticket> => {
  try {
    return await applyDraft(deps, ownerId, draft);
  } catch (error) {
    await deps.database.update(drafts).set({ status: "pending" }).where(eq(drafts.id, draft.id));
    throw error;
  }
};

export const proposeDraft = async (
  deps: TicketServiceDeps,
  ownerId: string,
  conversationId: string,
  input: DraftInput,
): Promise<Draft> => {
  await requireOwnedConversation(deps.database, ownerId, conversationId);
  const target = await findTargetTicket(deps, ownerId, input);
  const draft: Draft = {
    id: deps.ids.next(),
    conversationId,
    mode: input.mode,
    targetTicketId: target?.id ?? null,
    payload: draftPayloadOf(input),
    status: "pending",
    createdAt: deps.clock.now(),
  };

  await deps.database.transaction(async (transaction) => {
    await transaction
      .update(drafts)
      .set({ status: "cancelled" })
      .where(and(eq(drafts.conversationId, conversationId), eq(drafts.status, "pending")));
    await transaction.insert(drafts).values(draft);
  });

  return draft;
};

export const getPendingDraft = async (
  { database }: TicketServiceDeps,
  ownerId: string,
  conversationId: string,
): Promise<Draft | null> => {
  const [row] = await database
    .select({ draft: drafts })
    .from(drafts)
    .innerJoin(conversations, eq(drafts.conversationId, conversations.id))
    .where(
      and(
        eq(drafts.conversationId, conversationId),
        eq(drafts.status, "pending"),
        eq(conversations.employeeId, ownerId),
      ),
    )
    .orderBy(desc(drafts.createdAt))
    .limit(1);

  return row?.draft ?? null;
};

const rememberCreatedTicket = async (
  database: Database,
  draft: Draft,
  ticket: Ticket,
): Promise<Draft> => {
  if (draft.mode !== "create") {
    return draft;
  }

  await database.update(drafts).set({ targetTicketId: ticket.id }).where(eq(drafts.id, draft.id));

  return { ...draft, targetTicketId: ticket.id };
};

export const confirmDraft = async (
  deps: TicketServiceDeps,
  ownerId: string,
  draftId: string,
): Promise<ConfirmedDraft> => {
  const draft = await requireOwnedDraft(deps.database, ownerId, draftId);

  await moveFromPending(deps.database, draft.id, "confirmed");
  const ticket = await applyOrRelease(deps, ownerId, draft);
  const confirmed = await rememberCreatedTicket(deps.database, draft, ticket);

  return { draft: { ...confirmed, status: "confirmed" }, ticket };
};

export const cancelDraft = async (
  { database }: TicketServiceDeps,
  ownerId: string,
  draftId: string,
): Promise<Draft> => {
  const draft = await requireOwnedDraft(database, ownerId, draftId);

  await moveFromPending(database, draft.id, "cancelled");

  return { ...draft, status: "cancelled" };
};

export interface DraftDetails {
  readonly draft: Draft;
  readonly stored: StoredDraft;
  readonly targetTicketNumber: string | null;
}

const describeDraft = async (
  database: Database,
  ownerId: string,
  draft: Draft,
): Promise<DraftDetails> => {
  const [target] = draft.targetTicketId
    ? await database
        .select({ number: tickets.number })
        .from(tickets)
        .where(and(eq(tickets.id, draft.targetTicketId), eq(tickets.ownerId, ownerId)))
    : [];

  return { draft, stored: parseStoredDraft(draft), targetTicketNumber: target?.number ?? null };
};

export const getDraft = async (
  { database }: TicketServiceDeps,
  ownerId: string,
  draftId: string,
): Promise<DraftDetails> =>
  describeDraft(database, ownerId, await requireOwnedDraft(database, ownerId, draftId));

export const editDraft = async (
  deps: TicketServiceDeps,
  ownerId: string,
  draftId: string,
  input: DraftInput,
): Promise<DraftDetails> => {
  const draft = await requireOwnedDraft(deps.database, ownerId, draftId);

  if (draft.status !== "pending") {
    throw new DraftNotPendingError(draft.id, draft.status);
  }

  if (draft.mode !== input.mode) {
    throw new DraftModeChangeError(draft.id);
  }

  const target = await findTargetTicket(deps, ownerId, input);
  const updated = await updatePending(deps.database, draft.id, {
    payload: draftPayloadOf(input),
    targetTicketId: target?.id ?? null,
  });

  return describeDraft(deps.database, ownerId, updated);
};

export const createDraftService = (deps: TicketServiceDeps) => ({
  get: (ownerId: string, draftId: string) => getDraft(deps, ownerId, draftId),
  edit: (ownerId: string, draftId: string, input: DraftInput) =>
    editDraft(deps, ownerId, draftId, input),
  propose: (ownerId: string, conversationId: string, input: DraftInput) =>
    proposeDraft(deps, ownerId, conversationId, input),
  getPending: (ownerId: string, conversationId: string) =>
    getPendingDraft(deps, ownerId, conversationId),
  confirm: (ownerId: string, draftId: string) => confirmDraft(deps, ownerId, draftId),
  cancel: (ownerId: string, draftId: string) => cancelDraft(deps, ownerId, draftId),
});

export type DraftService = ReturnType<typeof createDraftService>;
