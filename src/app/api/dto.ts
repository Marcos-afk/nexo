import type { ConsoleLabel } from "@/domain/console";
import type { DraftMode, DraftStatus, MessageAuthorKind } from "@/domain/conversation";
import type { StoredDraft } from "@/domain/draft";
import type { AnalystLevel } from "@/domain/employee";
import { computeDueAt, type TicketPriority } from "@/domain/sla";
import type { Ticket, TicketEventKind, TicketStatus, TicketType } from "@/domain/ticket";
import type { CreateTicketInput } from "@/domain/ticket-input";
import { parseToolTrace, type ToolTraceEntry } from "@/domain/tool-trace";
import type { ConsoleConversation } from "@/services/console/console-conversation";
import type { ConsoleItem, ConsoleOverview } from "@/services/console/console-service";
import type { ConsoleTicketDetail, ConversationTickets } from "@/services/console/console-tickets";
import type { Decision } from "@/services/decisions/decision-service";
import type { Draft, DraftDetails } from "@/services/drafts/draft-service";

export interface DraftDto {
  readonly id: string;
  readonly conversationId: string;
  readonly mode: DraftMode;
  readonly status: DraftStatus;
  readonly targetTicketNumber: string | null;
  readonly ticket: CreateTicketInput | null;
  readonly note: string | null;
  readonly dueAt: string | null;
  readonly createdAt: string;
}

export interface DraftStatusDto {
  readonly id: string;
  readonly status: DraftStatus;
}

export interface TicketDto {
  readonly number: string;
  readonly type: TicketType;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly subcategory: string | null;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly affected: string | null;
  readonly dueAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt: string | null;
}

interface DraftContent {
  readonly ticket: CreateTicketInput | null;
  readonly note: string | null;
  readonly dueAt: string | null;
}

const contentOf = (stored: StoredDraft, createdAt: Date): DraftContent => {
  switch (stored.mode) {
    case "create":
      return {
        ticket: stored.payload,
        note: null,
        dueAt: computeDueAt(stored.payload.priority, createdAt).toISOString(),
      };
    case "update":
      return { ticket: null, note: stored.payload.note, dueAt: null };
    case "reopen":
      return { ticket: null, note: null, dueAt: null };
  }
};

export const toDraftDto = ({ draft, stored, targetTicketNumber }: DraftDetails): DraftDto => ({
  id: draft.id,
  conversationId: draft.conversationId,
  mode: draft.mode,
  status: draft.status,
  targetTicketNumber,
  createdAt: draft.createdAt.toISOString(),
  ...contentOf(stored, draft.createdAt),
});

export const toDraftStatusDto = ({ id, status }: Draft): DraftStatusDto => ({ id, status });

export const toTicketDto = (ticket: Ticket): TicketDto => ({
  number: ticket.number,
  type: ticket.type,
  title: ticket.title,
  description: ticket.description,
  category: ticket.category,
  subcategory: ticket.subcategory,
  priority: ticket.priority,
  status: ticket.status,
  affected: ticket.affected,
  dueAt: ticket.dueAt.toISOString(),
  createdAt: ticket.createdAt.toISOString(),
  updatedAt: ticket.updatedAt.toISOString(),
  resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
});

export interface DecisionDto {
  readonly messageId: string;
  readonly intent: string;
  readonly understood: string;
  readonly action: string;
  readonly confidence: number;
  readonly rationale: string;
  readonly signals: readonly string[];
  readonly toolCalls: readonly ToolTraceEntry[];
  readonly model: string;
  readonly tokensIn: number | null;
  readonly tokensOut: number | null;
  readonly latencyMs: number | null;
}

export const toDecisionDto = (decision: Decision): DecisionDto => ({
  messageId: decision.messageId,
  intent: decision.intent,
  understood: decision.understood,
  action: decision.action,
  confidence: decision.confidence,
  rationale: decision.rationale,
  signals: decision.signals,
  toolCalls: parseToolTrace(decision.toolCalls),
  model: decision.model,
  tokensIn: decision.tokensIn,
  tokensOut: decision.tokensOut,
  latencyMs: decision.latencyMs,
});

export type ConsoleLabelDto =
  | {
      readonly kind: "transferred";
      readonly ticketNumber: string | null;
      readonly contactDueAt: string | null;
    }
  | {
      readonly kind: "agent_asked_help";
      readonly confidence: number;
      readonly decisionMessageId: string;
    }
  | { readonly kind: "agent_active" }
  | { readonly kind: "resolved_by_agent" }
  | { readonly kind: "closed" }
  | { readonly kind: "mine" }
  | { readonly kind: "with_other"; readonly analystName: string };

export interface ConsoleItemDto {
  readonly id: string;
  readonly employee: ConsoleItem["employee"];
  readonly mode: ConsoleItem["mode"];
  readonly ticketNumber: string | null;
  readonly updatedAt: string;
  readonly preview: {
    readonly text: string;
    readonly authorKind: MessageAuthorKind;
    readonly at: string;
  } | null;
  readonly unread: number;
  readonly label: ConsoleLabelDto;
}

export interface ConsoleDto {
  readonly me: ConsoleOverview["me"];
  readonly items: readonly ConsoleItemDto[];
  readonly counts: ConsoleOverview["counts"];
  readonly attention: number;
}

const toLabelDto = (label: ConsoleLabel): ConsoleLabelDto =>
  label.kind === "transferred"
    ? {
        kind: "transferred",
        ticketNumber: label.ticketNumber,
        contactDueAt: label.contactDueAt?.toISOString() ?? null,
      }
    : label;

const toConsoleItemDto = (item: ConsoleItem): ConsoleItemDto => ({
  id: item.id,
  employee: item.employee,
  mode: item.mode,
  ticketNumber: item.ticketNumber,
  updatedAt: item.updatedAt.toISOString(),
  preview: item.preview
    ? {
        text: item.preview.text,
        authorKind: item.preview.authorKind,
        at: item.preview.at.toISOString(),
      }
    : null,
  unread: item.unread,
  label: toLabelDto(item.label),
});

export const toConsoleDto = ({ me, items, counts, attention }: ConsoleOverview): ConsoleDto => ({
  me,
  items: items.map(toConsoleItemDto),
  counts,
  attention,
});

export interface ConsoleMessageDto {
  readonly id: string;
  readonly authorKind: MessageAuthorKind;
  readonly authorName: string | null;
  readonly authorLevel: AnalystLevel | null;
  readonly content: string;
  readonly createdAt: string;
  readonly readByEmployee: boolean | null;
}

export interface ConsoleConversationDto {
  readonly id: string;
  readonly viewerId: string;
  readonly employee: ConsoleConversation["employee"];
  readonly employeeOnline: boolean;
  readonly mode: ConsoleConversation["mode"];
  readonly handoffLevel: AnalystLevel | null;
  readonly handoffReason: string | null;
  readonly handoffSummary: string | null;
  readonly contactDueAt: string | null;
  readonly ticket: ConsoleConversation["ticket"];
  readonly assignedAnalyst: ConsoleConversation["assignedAnalyst"];
  readonly messages: readonly ConsoleMessageDto[];
}

export const toConsoleConversationDto = (
  conversation: ConsoleConversation,
): ConsoleConversationDto => ({
  id: conversation.id,
  viewerId: conversation.viewerId,
  employee: conversation.employee,
  employeeOnline: conversation.employeeOnline,
  mode: conversation.mode,
  handoffLevel: conversation.handoffLevel,
  handoffReason: conversation.handoffReason,
  handoffSummary: conversation.handoffSummary,
  contactDueAt: conversation.contactDueAt?.toISOString() ?? null,
  ticket: conversation.ticket,
  assignedAnalyst: conversation.assignedAnalyst,
  messages: conversation.messages.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
  })),
});

export interface ConsoleTicketItemDto {
  readonly number: string;
  readonly title: string;
  readonly status: TicketStatus;
  readonly priority: TicketPriority;
  readonly dueAt: string;
  readonly updatedAt: string;
  readonly overdue: boolean;
  readonly isCurrent: boolean;
  readonly lastEvent: { readonly text: string; readonly at: string } | null;
}

export interface ConversationTicketsDto {
  readonly employeeName: string;
  readonly open: number;
  readonly closed: number;
  readonly tickets: readonly ConsoleTicketItemDto[];
}

export interface ConsoleTicketDetailDto {
  readonly ticket: TicketDto;
  readonly overdue: boolean;
  readonly events: readonly {
    readonly id: string;
    readonly kind: TicketEventKind;
    readonly text: string;
    readonly at: string;
  }[];
}

export const toConversationTicketsDto = ({
  employeeName,
  open,
  closed,
  tickets,
}: ConversationTickets): ConversationTicketsDto => ({
  employeeName,
  open,
  closed,
  tickets: tickets.map(({ ticket, overdue, isCurrent, lastEvent }) => ({
    number: ticket.number,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    dueAt: ticket.dueAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    overdue,
    isCurrent,
    lastEvent: lastEvent ? { text: lastEvent.text, at: lastEvent.at.toISOString() } : null,
  })),
});

export const toConsoleTicketDetailDto = ({
  ticket,
  overdue,
  events,
}: ConsoleTicketDetail): ConsoleTicketDetailDto => ({
  ticket: toTicketDto(ticket),
  overdue,
  events: events.map((event) => ({ ...event, at: event.at.toISOString() })),
});
