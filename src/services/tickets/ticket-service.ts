import { and, desc, eq, gte, like, ne, or, sql } from "drizzle-orm";
import type { Database, DatabaseExecutor } from "../../db/client";
import { ticketEvents, tickets } from "../../db/schema";
import {
  TicketClosedError,
  TicketNotFoundError,
  TicketNotReopenableError,
} from "../../domain/errors";
import { computeDueAt } from "../../domain/sla";
import type { Ticket, TicketEventKind, TicketStatus, TicketType } from "../../domain/ticket";
import type { CreateTicketInput } from "../../domain/ticket-input";
import {
  formatTicketNumber,
  isClosed,
  isReopenable,
  REOPEN_WINDOW_DAYS,
  ticketNumberPrefix,
} from "../../domain/ticket-rules";
import type { Clock } from "../../lib/clock";
import type { IdGenerator } from "../../lib/ids";
import { requireAnalyst } from "../analysts/require-analyst";

export interface TicketServiceDeps {
  readonly database: Database;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export interface TicketRef {
  readonly ownerId: string;
  readonly number: string;
}

export interface ListTicketsOptions {
  readonly status?: TicketStatus;
  readonly limit?: number;
}

export interface SimilarTickets {
  readonly open: readonly Ticket[];
  readonly recentlyResolved: readonly Ticket[];
}

interface EventInput {
  readonly ticketId: string;
  readonly kind: TicketEventKind;
  readonly actor: string;
  readonly payload: unknown;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MS_PER_DAY = 86_400_000;
const NO_TICKETS_SEQUENCE = 0;

const ownedBy = ({ ownerId, number }: TicketRef) =>
  and(eq(tickets.ownerId, ownerId), eq(tickets.number, number));

const findOwned = async (executor: DatabaseExecutor, ref: TicketRef): Promise<Ticket | null> => {
  const [ticket] = await executor.select().from(tickets).where(ownedBy(ref));

  return ticket ?? null;
};

const requireOwned = async (executor: DatabaseExecutor, ref: TicketRef): Promise<Ticket> => {
  const ticket = await findOwned(executor, ref);

  if (!ticket) {
    throw new TicketNotFoundError(ref.number);
  }

  return ticket;
};

const requireOpen = async (executor: DatabaseExecutor, ref: TicketRef): Promise<Ticket> => {
  const ticket = await requireOwned(executor, ref);

  if (isClosed(ticket.status)) {
    throw new TicketClosedError(ref.number);
  }

  return ticket;
};

const recordEvent = async (
  executor: DatabaseExecutor,
  { ids, clock }: Pick<TicketServiceDeps, "ids" | "clock">,
  event: EventInput,
): Promise<void> => {
  await executor.insert(ticketEvents).values({ id: ids.next(), createdAt: clock.now(), ...event });
};

const nextTicketNumber = async (executor: DatabaseExecutor, type: TicketType): Promise<string> => {
  const prefix = ticketNumberPrefix(type);
  const sequencePosition = prefix.length + 2;
  const [row] = await executor
    .select({
      last: sql<
        number | null
      >`max(cast(substr(${tickets.number}, ${sequencePosition}) as integer))`,
    })
    .from(tickets)
    .where(like(tickets.number, `${prefix}-%`));

  return formatTicketNumber(type, (row?.last ?? NO_TICKETS_SEQUENCE) + 1);
};

export const listTickets = (
  { database }: TicketServiceDeps,
  ownerId: string,
  { status, limit = DEFAULT_PAGE_SIZE }: ListTicketsOptions = {},
): Promise<readonly Ticket[]> =>
  database
    .select()
    .from(tickets)
    .where(and(eq(tickets.ownerId, ownerId), status ? eq(tickets.status, status) : undefined))
    .orderBy(desc(tickets.createdAt))
    .limit(Math.min(limit, MAX_PAGE_SIZE));

export const getTicket = (
  { database }: TicketServiceDeps,
  ref: TicketRef,
): Promise<Ticket | null> => findOwned(database, ref);

export const findSimilarTickets = async (
  { database, clock }: TicketServiceDeps,
  ownerId: string,
  category: string,
): Promise<SimilarTickets> => {
  const reopenCutoff = new Date(clock.now().getTime() - REOPEN_WINDOW_DAYS * MS_PER_DAY);
  const candidates = await database
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.ownerId, ownerId),
        eq(tickets.category, category),
        or(ne(tickets.status, "resolved"), gte(tickets.resolvedAt, reopenCutoff)),
      ),
    )
    .orderBy(desc(tickets.createdAt))
    .limit(MAX_PAGE_SIZE);

  return {
    open: candidates.filter((ticket) => !isClosed(ticket.status)),
    recentlyResolved: candidates.filter((ticket) => isClosed(ticket.status)),
  };
};

export const createTicket = (
  deps: TicketServiceDeps,
  ownerId: string,
  input: CreateTicketInput,
): Promise<Ticket> =>
  deps.database.transaction(async (transaction) => {
    const now = deps.clock.now();
    const ticket: Ticket = {
      ...input,
      id: deps.ids.next(),
      number: await nextTicketNumber(transaction, input.type),
      status: "open",
      ownerId,
      createdAt: now,
      updatedAt: now,
      dueAt: computeDueAt(input.priority, now),
      resolvedAt: null,
    };

    await transaction.insert(tickets).values(ticket);
    await recordEvent(transaction, deps, {
      ticketId: ticket.id,
      kind: "created",
      actor: ownerId,
      payload: null,
    });

    return ticket;
  });

export const addTicketNote = (
  deps: TicketServiceDeps,
  ref: TicketRef,
  note: string,
): Promise<Ticket> =>
  deps.database.transaction(async (transaction) => {
    const ticket = await requireOpen(transaction, ref);
    const updatedAt = deps.clock.now();

    await transaction.update(tickets).set({ updatedAt }).where(eq(tickets.id, ticket.id));
    await recordEvent(transaction, deps, {
      ticketId: ticket.id,
      kind: "updated",
      actor: ref.ownerId,
      payload: { note },
    });

    return { ...ticket, updatedAt };
  });

export const reopenTicket = (deps: TicketServiceDeps, ref: TicketRef): Promise<Ticket> =>
  deps.database.transaction(async (transaction) => {
    const ticket = await requireOwned(transaction, ref);
    const now = deps.clock.now();

    if (!isClosed(ticket.status) || !ticket.resolvedAt) {
      throw new TicketNotReopenableError(ref.number, "not_resolved");
    }

    if (!isReopenable(ticket.resolvedAt, now)) {
      throw new TicketNotReopenableError(ref.number, "window_expired");
    }

    const reopened: Ticket = {
      ...ticket,
      status: "open",
      resolvedAt: null,
      updatedAt: now,
      dueAt: computeDueAt(ticket.priority, now),
    };

    await transaction.update(tickets).set(reopened).where(eq(tickets.id, ticket.id));
    await recordEvent(transaction, deps, {
      ticketId: ticket.id,
      kind: "reopened",
      actor: ref.ownerId,
      payload: null,
    });

    return reopened;
  });

export const transferTicketToAnalyst = (
  deps: TicketServiceDeps,
  ref: TicketRef,
  reason: string,
): Promise<Ticket> =>
  deps.database.transaction(async (transaction) => {
    const ticket = await requireOpen(transaction, ref);
    const updatedAt = deps.clock.now();
    const status = "awaiting_analyst";

    await transaction.update(tickets).set({ status, updatedAt }).where(eq(tickets.id, ticket.id));
    await recordEvent(transaction, deps, {
      ticketId: ticket.id,
      kind: "transferred",
      actor: ref.ownerId,
      payload: { reason },
    });

    return { ...ticket, status, updatedAt };
  });

const requireOpenById = async (executor: DatabaseExecutor, ticketId: string): Promise<Ticket> => {
  const [ticket] = await executor.select().from(tickets).where(eq(tickets.id, ticketId));

  if (!ticket) {
    throw new TicketNotFoundError(ticketId);
  }

  if (isClosed(ticket.status)) {
    throw new TicketClosedError(ticket.number);
  }

  return ticket;
};

export const assumeTicket = (
  deps: TicketServiceDeps,
  analystId: string,
  ticketId: string,
): Promise<Ticket> =>
  deps.database.transaction(async (transaction) => {
    await requireAnalyst(transaction, analystId);
    const ticket = await requireOpenById(transaction, ticketId);
    const updatedAt = deps.clock.now();
    const status = "in_progress";

    await transaction.update(tickets).set({ status, updatedAt }).where(eq(tickets.id, ticket.id));
    await recordEvent(transaction, deps, {
      ticketId: ticket.id,
      kind: "assumed",
      actor: analystId,
      payload: null,
    });

    return { ...ticket, status, updatedAt };
  });

export const resolveTicket = (
  deps: TicketServiceDeps,
  analystId: string,
  ticketId: string,
  resolution: string,
): Promise<Ticket> =>
  deps.database.transaction(async (transaction) => {
    await requireAnalyst(transaction, analystId);
    const ticket = await requireOpenById(transaction, ticketId);
    const now = deps.clock.now();
    const resolved: Ticket = { ...ticket, status: "resolved", resolvedAt: now, updatedAt: now };

    await transaction.update(tickets).set(resolved).where(eq(tickets.id, ticket.id));
    await recordEvent(transaction, deps, {
      ticketId: ticket.id,
      kind: "resolved",
      actor: analystId,
      payload: { resolution },
    });

    return resolved;
  });

export const createTicketService = (deps: TicketServiceDeps) => ({
  assume: (analystId: string, ticketId: string) => assumeTicket(deps, analystId, ticketId),
  resolve: (analystId: string, ticketId: string, resolution: string) =>
    resolveTicket(deps, analystId, ticketId, resolution),
  list: (ownerId: string, options?: ListTicketsOptions) => listTickets(deps, ownerId, options),
  get: (ref: TicketRef) => getTicket(deps, ref),
  findSimilar: (ownerId: string, category: string) => findSimilarTickets(deps, ownerId, category),
  create: (ownerId: string, input: CreateTicketInput) => createTicket(deps, ownerId, input),
  addNote: (ref: TicketRef, note: string) => addTicketNote(deps, ref, note),
  reopen: (ref: TicketRef) => reopenTicket(deps, ref),
  transferToAnalyst: (ref: TicketRef, reason: string) => transferTicketToAnalyst(deps, ref, reason),
});

export type TicketService = ReturnType<typeof createTicketService>;
