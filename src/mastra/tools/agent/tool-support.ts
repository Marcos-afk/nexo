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
import { formatOfficeDateTime } from "../../../domain/sla";
import { type Ticket, ticketStatusLabels } from "../../../domain/ticket";
import { isClosed, isReopenable, isTicketOverdue } from "../../../domain/ticket-rules";
import { ticketDetailSchema, ticketSummarySchema } from "../../../domain/ticket-view";
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

export { ticketDetailSchema, ticketSummarySchema };

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
