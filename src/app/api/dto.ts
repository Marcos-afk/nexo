import type { DraftMode, DraftStatus } from "@/domain/conversation";
import type { StoredDraft } from "@/domain/draft";
import { computeDueAt, type TicketPriority } from "@/domain/sla";
import type { Ticket, TicketStatus, TicketType } from "@/domain/ticket";
import type { CreateTicketInput } from "@/domain/ticket-input";
import { parseToolTrace, type ToolTraceEntry } from "@/domain/tool-trace";
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
