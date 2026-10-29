import type { ConversationMode } from "./conversation";
import { CONFIDENCE_HANDOFF_THRESHOLD } from "./turn-policy";

export const consoleFilters = ["all", "for_you", "with_agent", "mine"] as const;
export const analystAvailabilities = ["online", "offline"] as const;

export type ConsoleFilter = (typeof consoleFilters)[number];
export type AnalystAvailability = (typeof analystAvailabilities)[number];

export type ConsoleLabel =
  | {
      readonly kind: "transferred";
      readonly ticketNumber: string | null;
      readonly contactDueAt: Date | null;
    }
  | { readonly kind: "agent_asked_help"; readonly confidence: number }
  | { readonly kind: "agent_active" }
  | { readonly kind: "resolved_by_agent" }
  | { readonly kind: "closed" }
  | { readonly kind: "mine" }
  | { readonly kind: "with_other"; readonly analystName: string };

export interface LabelFacts {
  readonly mode: ConversationMode;
  readonly assignedAnalystId: string | null;
  readonly assignedAnalystName: string | null;
  readonly viewerId: string;
  readonly handoffReason: string | null;
  readonly ticketNumber: string | null;
  readonly contactDueAt: Date | null;
  readonly lastConfidence: number | null;
}

const awaitingLabelOf = (facts: LabelFacts): ConsoleLabel =>
  facts.lastConfidence !== null && facts.lastConfidence < CONFIDENCE_HANDOFF_THRESHOLD
    ? { kind: "agent_asked_help", confidence: facts.lastConfidence }
    : { kind: "transferred", ticketNumber: facts.ticketNumber, contactDueAt: facts.contactDueAt };

const assignedLabelOf = (facts: LabelFacts): ConsoleLabel =>
  facts.assignedAnalystId === facts.viewerId
    ? { kind: "mine" }
    : { kind: "with_other", analystName: facts.assignedAnalystName ?? "" };

const LABEL_BY_MODE: Readonly<Record<ConversationMode, (facts: LabelFacts) => ConsoleLabel>> = {
  agent: () => ({ kind: "agent_active" }),
  awaiting_analyst: awaitingLabelOf,
  with_analyst: assignedLabelOf,
  closed: ({ handoffReason }) =>
    handoffReason === null ? { kind: "resolved_by_agent" } : { kind: "closed" },
};

export const labelOf = (facts: LabelFacts): ConsoleLabel => LABEL_BY_MODE[facts.mode](facts);

export interface AttentionFacts {
  readonly mode: ConversationMode;
  readonly assignedAnalystId: string | null;
  readonly viewerId: string;
  readonly unread: number;
}

export const needsAttention = ({
  mode,
  assignedAnalystId,
  viewerId,
  unread,
}: AttentionFacts): boolean =>
  mode === "awaiting_analyst" ||
  (mode === "with_analyst" && assignedAnalystId === viewerId && unread > 0);
