import type { ConversationMode } from "./conversation";
import type { Triage, TriageIntent } from "./triage";

export const CONFIDENCE_HANDOFF_THRESHOLD = 70;

export const agentToolNames = [
  "listMyTickets",
  "getTicket",
  "searchHelpArticles",
  "findSimilarTickets",
  "buildDraft",
  "requestHandoff",
] as const;

export type AgentToolName = (typeof agentToolNames)[number];

export type PolicyHandoffReason = "employee_request" | "critical_incident" | "low_confidence";

export interface PolicyFacts {
  readonly mode: ConversationMode;
  readonly triage: Triage;
  readonly hasOverdueTicket: boolean;
}

export type TurnDecision =
  | { readonly kind: "skip_agent" }
  | { readonly kind: "redirect_out_of_scope" }
  | { readonly kind: "handoff"; readonly reason: PolicyHandoffReason }
  | {
      readonly kind: "answer";
      readonly tools: readonly AgentToolName[];
      readonly offerAnalyst: boolean;
    };

const toolsByIntent = {
  how_to: ["searchHelpArticles"],
  ticket_lookup: ["listMyTickets", "getTicket"],
  ticket_create: ["searchHelpArticles", "findSimilarTickets", "buildDraft"],
  human_request: [],
  out_of_scope: [],
  chitchat: [],
  unclear: [],
} as const satisfies Record<TriageIntent, readonly AgentToolName[]>;

const asksForAnalyst = ({ intent, signals }: Triage): boolean =>
  intent === "human_request" || signals.includes("asks_for_human");

const isCriticalIncident = ({ signals }: Triage): boolean => signals.includes("critical_impact");

const isLowConfidence = ({ confidence }: Triage): boolean =>
  confidence < CONFIDENCE_HANDOFF_THRESHOLD;

const handoff = (reason: PolicyHandoffReason): TurnDecision => ({ kind: "handoff", reason });

export const actionLabelOf = (decision: TurnDecision): string =>
  decision.kind === "handoff" ? `${decision.kind}:${decision.reason}` : decision.kind;

export const shouldInvokeAgent = (mode: ConversationMode): boolean => mode === "agent";

export const decideTurn = ({ mode, triage, hasOverdueTicket }: PolicyFacts): TurnDecision => {
  if (!shouldInvokeAgent(mode)) {
    return { kind: "skip_agent" };
  }

  if (asksForAnalyst(triage)) {
    return handoff("employee_request");
  }

  if (isCriticalIncident(triage)) {
    return handoff("critical_incident");
  }

  if (triage.intent === "out_of_scope") {
    return { kind: "redirect_out_of_scope" };
  }

  if (isLowConfidence(triage)) {
    return handoff("low_confidence");
  }

  return { kind: "answer", tools: toolsByIntent[triage.intent], offerAnalyst: hasOverdueTicket };
};
