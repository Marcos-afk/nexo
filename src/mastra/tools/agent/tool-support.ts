import { z } from "zod";
import {
  ConversationClosedError,
  ConversationNotFoundError,
  DraftNotFoundError,
  DraftNotPendingError,
  InvalidConversationTransitionError,
  LegacyUnavailableError,
  TicketClosedError,
  TicketNotFoundError,
  TicketNotReopenableError,
} from "../../../domain/errors";
import { formatOfficeDateTime, ticketPriorities } from "../../../domain/sla";
import { type Ticket, ticketStatusLabels, ticketTypes } from "../../../domain/ticket";
import { isClosed, isReopenable, isTicketOverdue } from "../../../domain/ticket-rules";
import type { Clock } from "../../../lib/clock";
import type { DraftService } from "../../../services/drafts/draft-service";
import type { HandoffService } from "../../../services/handoff/handoff-service";
import type { HelpCenterService } from "../../../services/help-center/help-center-service";
import type { TicketService } from "../../../services/tickets/ticket-service";

export interface AgentToolDeps {
  readonly tickets: TicketService;
  readonly helpCenter: HelpCenterService;
  readonly drafts: DraftService;
  readonly handoff: HandoffService;
  readonly clock: Clock;
}

const userFacingErrors = [
  TicketNotFoundError,
  TicketClosedError,
  TicketNotReopenableError,
  DraftNotFoundError,
  DraftNotPendingError,
  ConversationNotFoundError,
  ConversationClosedError,
  InvalidConversationTransitionError,
  LegacyUnavailableError,
] as const;

export const failureSchema = z.object({ error: z.string() });

export type ToolFailure = z.infer<typeof failureSchema>;

export const withFailure = <T extends z.ZodType>(success: T) => z.union([success, failureSchema]);

export const runTool = async <T>(action: () => Promise<T>): Promise<T | ToolFailure> => {
  try {
    return await action();
  } catch (error) {
    if (userFacingErrors.some((ErrorClass) => error instanceof ErrorClass)) {
      return { error: error instanceof Error ? error.message : String(error) };
    }

    throw error;
  }
};

export const ticketSummarySchema = z.object({
  number: z.string(),
  title: z.string(),
  category: z.string(),
  status: z
    .string()
    .describe("Situação do chamado em português, como deve ser dita ao funcionário"),
  priority: z.enum(ticketPriorities),
  dueAt: z.string().describe("Horário de Brasília, já formatado"),
  overdue: z.boolean(),
  updatedAt: z.string().describe("Horário de Brasília, já formatado"),
});

export const ticketDetailSchema = ticketSummarySchema.extend({
  type: z.enum(ticketTypes),
  subcategory: z.string().nullable(),
  description: z.string(),
  affected: z.string().nullable(),
  createdAt: z.string().describe("Horário de Brasília, já formatado"),
  resolvedAt: z.string().nullable().describe("Horário de Brasília, já formatado"),
  reopenable: z.boolean(),
});

export const toTicketSummary = (ticket: Ticket, clock: Clock) => ({
  number: ticket.number,
  title: ticket.title,
  category: ticket.category,
  status: ticketStatusLabels[ticket.status],
  priority: ticket.priority,
  dueAt: formatOfficeDateTime(ticket.dueAt),
  overdue: isTicketOverdue(ticket, clock.now()),
  updatedAt: formatOfficeDateTime(ticket.updatedAt),
});

export const toTicketDetail = (ticket: Ticket, clock: Clock) => ({
  ...toTicketSummary(ticket, clock),
  type: ticket.type,
  subcategory: ticket.subcategory,
  description: ticket.description,
  affected: ticket.affected,
  createdAt: formatOfficeDateTime(ticket.createdAt),
  resolvedAt: ticket.resolvedAt ? formatOfficeDateTime(ticket.resolvedAt) : null,
  reopenable:
    isClosed(ticket.status) &&
    ticket.resolvedAt !== null &&
    isReopenable(ticket.resolvedAt, clock.now()),
});
