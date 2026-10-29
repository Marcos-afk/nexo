import type { ConversationMode } from "../domain/conversation";
import type { AnalystLevel } from "../domain/employee";
import type { HandoffRequest } from "../domain/handoff";
import type { HandoffUrgency } from "../domain/sla";
import { isTicketOverdue } from "../domain/ticket-rules";
import type { Triage } from "../domain/triage";
import {
  type AgentToolName,
  actionLabelOf,
  decideTurn,
  type PolicyHandoffReason,
  type TurnDecision,
} from "../domain/turn-policy";
import type { Clock } from "../lib/clock";
import type { ConversationRef } from "../services/conversations/conversation-service";
import type { HandoffService } from "../services/handoff/handoff-service";
import type { TicketService } from "../services/tickets/ticket-service";
import { handoffDoneReply, outOfScopeReply } from "./turn-replies";

export interface TurnPlannerDeps {
  readonly tickets: TicketService;
  readonly handoff: HandoffService;
  readonly clock: Clock;
}

export interface TurnInput {
  readonly ref: ConversationRef;
  readonly mode: ConversationMode;
  readonly text: string;
  readonly triage: Triage;
}

export type TurnPlan =
  | { readonly kind: "skip" }
  | { readonly kind: "fixed_reply"; readonly action: string; readonly text: string }
  | {
      readonly kind: "answer";
      readonly action: string;
      readonly toolNames: readonly AgentToolName[];
      readonly offerAnalyst: boolean;
    };

const handoffReasonText = {
  employee_request: "Pedido do funcionário",
  critical_incident: "Incidente crítico",
  low_confidence: "O assistente não teve segurança para responder",
} as const satisfies Record<PolicyHandoffReason, string>;

const handoffUrgency = {
  employee_request: "normal",
  critical_incident: "urgent",
  low_confidence: "normal",
} as const satisfies Record<PolicyHandoffReason, HandoffUrgency>;

const hasOverdueTicket = async (
  { tickets, clock }: TurnPlannerDeps,
  { ref, triage }: TurnInput,
): Promise<boolean> => {
  if (triage.intent !== "ticket_lookup") {
    return false;
  }

  const owned = await tickets.list(ref.ownerId);

  return owned.some((ticket) => isTicketOverdue(ticket, clock.now()));
};

const handoffLevel = {
  employee_request: "N1",
  critical_incident: "N2",
  low_confidence: "N2",
} as const satisfies Record<PolicyHandoffReason, AnalystLevel>;

const buildHandoffInput = (reason: PolicyHandoffReason, input: TurnInput): HandoffRequest => ({
  reason: handoffReasonText[reason],
  level: handoffLevel[reason],
  summary: `${input.triage.understood}\nÚltima mensagem do funcionário: "${input.text}"`,
  urgency: handoffUrgency[reason],
});

const planHandoff = async (
  { handoff }: TurnPlannerDeps,
  input: TurnInput,
  decision: Extract<TurnDecision, { kind: "handoff" }>,
): Promise<TurnPlan> => {
  await handoff.request(
    input.ref.ownerId,
    input.ref.conversationId,
    buildHandoffInput(decision.reason, input),
  );

  return { kind: "fixed_reply", action: actionLabelOf(decision), text: handoffDoneReply };
};

const planFromDecision = (
  deps: TurnPlannerDeps,
  input: TurnInput,
  decision: TurnDecision,
): Promise<TurnPlan> | TurnPlan => {
  switch (decision.kind) {
    case "skip_agent":
      return { kind: "skip" };
    case "redirect_out_of_scope":
      return { kind: "fixed_reply", action: actionLabelOf(decision), text: outOfScopeReply };
    case "handoff":
      return planHandoff(deps, input, decision);
    case "answer":
      return {
        kind: "answer",
        action: actionLabelOf(decision),
        toolNames: decision.tools,
        offerAnalyst: decision.offerAnalyst,
      };
  }
};

export const planTurn = async (deps: TurnPlannerDeps, input: TurnInput): Promise<TurnPlan> => {
  const decision = decideTurn({
    mode: input.mode,
    triage: input.triage,
    hasOverdueTicket: await hasOverdueTicket(deps, input),
  });

  return planFromDecision(deps, input, decision);
};
