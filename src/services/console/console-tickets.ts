import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { conversations, employees, ticketEvents, tickets } from "../../db/schema";
import { ConversationNotFoundError, TicketNotFoundError } from "../../domain/errors";
import type { Ticket, TicketEventKind } from "../../domain/ticket";
import { ticketEventText } from "../../domain/ticket-event-text";
import { isTicketOverdue } from "../../domain/ticket-rules";
import type { Clock } from "../../lib/clock";
import { requireAnalyst } from "../analysts/require-analyst";

const MAX_LISTED_TICKETS = 50;

export interface ConsoleTicketsDeps {
  readonly database: Database;
  readonly clock: Clock;
}

export interface TicketLastEvent {
  readonly text: string;
  readonly at: Date;
}

export interface ConsoleTicketItem {
  readonly ticket: Ticket;
  readonly overdue: boolean;
  readonly isCurrent: boolean;
  readonly lastEvent: TicketLastEvent | null;
}

export interface ConversationTickets {
  readonly employeeName: string;
  readonly open: number;
  readonly closed: number;
  readonly tickets: readonly ConsoleTicketItem[];
}

export interface ConsoleTicketEvent {
  readonly id: string;
  readonly kind: TicketEventKind;
  readonly text: string;
  readonly at: Date;
}

export interface ConsoleTicketDetail {
  readonly ticket: Ticket;
  readonly overdue: boolean;
  readonly events: readonly ConsoleTicketEvent[];
}

interface ConversationOwner {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly currentTicketId: string | null;
}

const requireOwner = async (
  database: Database,
  conversationId: string,
): Promise<ConversationOwner> => {
  const [row] = await database
    .select({
      employeeId: conversations.employeeId,
      employeeName: employees.name,
      currentTicketId: conversations.ticketId,
    })
    .from(conversations)
    .innerJoin(employees, eq(conversations.employeeId, employees.id))
    .where(eq(conversations.id, conversationId));

  if (!row) {
    throw new ConversationNotFoundError(conversationId);
  }

  return row;
};

const countByState = async (database: Database, employeeId: string) => {
  const [row] = await database
    .select({
      total: count(),
      closed: sql<number>`coalesce(sum(case when ${tickets.status} = 'resolved' then 1 else 0 end), 0)`,
    })
    .from(tickets)
    .where(eq(tickets.ownerId, employeeId));
  const total = row?.total ?? 0;
  const closed = row?.closed ?? 0;

  return { open: total - closed, closed };
};

const lastEventsOf = async (
  database: Database,
  ticketIds: readonly string[],
): Promise<ReadonlyMap<string, TicketLastEvent>> => {
  if (ticketIds.length === 0) {
    return new Map();
  }

  const rows = await database
    .select({
      ticketId: ticketEvents.ticketId,
      kind: ticketEvents.kind,
      payload: ticketEvents.payload,
      at: ticketEvents.createdAt,
      actorName: employees.name,
    })
    .from(ticketEvents)
    .leftJoin(employees, eq(ticketEvents.actor, employees.id))
    .where(inArray(ticketEvents.ticketId, ticketIds))
    .orderBy(desc(ticketEvents.createdAt));

  return new Map(
    [...rows].reverse().map((row) => [
      row.ticketId,
      {
        text: ticketEventText(row.kind, { actorName: row.actorName, payload: row.payload }),
        at: row.at,
      },
    ]),
  );
};

export const listConversationTickets = async (
  { database, clock }: ConsoleTicketsDeps,
  analystId: string,
  conversationId: string,
): Promise<ConversationTickets> => {
  await requireAnalyst(database, analystId);

  const owner = await requireOwner(database, conversationId);
  const rows = await database
    .select()
    .from(tickets)
    .where(eq(tickets.ownerId, owner.employeeId))
    .orderBy(desc(tickets.createdAt))
    .limit(MAX_LISTED_TICKETS);
  const [counts, lastEvents] = await Promise.all([
    countByState(database, owner.employeeId),
    lastEventsOf(
      database,
      rows.map((ticket) => ticket.id),
    ),
  ]);

  return {
    employeeName: owner.employeeName,
    ...counts,
    tickets: rows.map((ticket) => ({
      ticket,
      overdue: isTicketOverdue(ticket, clock.now()),
      isCurrent: ticket.id === owner.currentTicketId,
      lastEvent: lastEvents.get(ticket.id) ?? null,
    })),
  };
};

export const getConversationTicket = async (
  { database, clock }: ConsoleTicketsDeps,
  analystId: string,
  conversationId: string,
  number: string,
): Promise<ConsoleTicketDetail> => {
  await requireAnalyst(database, analystId);

  const owner = await requireOwner(database, conversationId);
  const [ticket] = await database
    .select()
    .from(tickets)
    .where(and(eq(tickets.ownerId, owner.employeeId), eq(tickets.number, number)));

  if (!ticket) {
    throw new TicketNotFoundError(number);
  }

  const events = await database
    .select({
      id: ticketEvents.id,
      kind: ticketEvents.kind,
      payload: ticketEvents.payload,
      at: ticketEvents.createdAt,
      actorName: employees.name,
    })
    .from(ticketEvents)
    .leftJoin(employees, eq(ticketEvents.actor, employees.id))
    .where(eq(ticketEvents.ticketId, ticket.id))
    .orderBy(asc(ticketEvents.createdAt));

  return {
    ticket,
    overdue: isTicketOverdue(ticket, clock.now()),
    events: events.map((event) => ({
      id: event.id,
      kind: event.kind,
      text: ticketEventText(event.kind, { actorName: event.actorName, payload: event.payload }),
      at: event.at,
    })),
  };
};
