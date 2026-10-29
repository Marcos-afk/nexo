import type { ConversationMode } from "../domain/conversation";
import { shouldInvokeAgent } from "../domain/turn-policy";
import { beginChatTurn, type ChatTurn } from "../services/conversations/chat-turn";
import { observeModel } from "./model-health";
import { type ReplyDeps, type ReplyStream, streamAnswer, streamFixedReply } from "./reply-streams";
import { runTriage, type TriageRunnerDeps } from "./triage-runner";
import { planTurn, type TurnPlannerDeps } from "./turn-planner";

export interface ChatOrchestratorDeps extends ReplyDeps, TurnPlannerDeps {
  readonly triageAgent: TriageRunnerDeps["agent"];
}

export type ChatReply =
  | { readonly kind: "skipped"; readonly mode: ConversationMode }
  | { readonly kind: "stream"; readonly stream: ReplyStream };

const skipped = (turn: ChatTurn): ChatReply => ({ kind: "skipped", mode: turn.mode });

const toStreamReply = (stream: ReplyStream): ChatReply => ({ kind: "stream", stream });

export const handleChatMessage = async (
  deps: ChatOrchestratorDeps,
  employeeId: string,
  text: string,
): Promise<ChatReply> => {
  const turn = await beginChatTurn(deps.conversations, employeeId, text);

  if (!shouldInvokeAgent(turn.mode)) {
    return skipped(turn);
  }

  const triage = await observeModel(deps.modelHealth, () =>
    runTriage({ agent: deps.triageAgent, clock: deps.clock }, turn.history),
  );
  const plan = await planTurn(deps, {
    ref: turn.ref,
    mode: turn.mode,
    text,
    triage: triage.triage,
  });

  switch (plan.kind) {
    case "skip":
      return skipped(turn);
    case "fixed_reply":
      return toStreamReply(await streamFixedReply(deps, turn, plan, triage));
    case "answer":
      return toStreamReply(await streamAnswer(deps, turn, plan, triage));
  }
};
