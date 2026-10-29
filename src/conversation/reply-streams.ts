import { toAISdkStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { createUIMessageStream, type UIMessage } from "ai";
import type { Clock } from "../lib/clock";
import { createSupportAgent } from "../mastra/agents/support-agent-factory";
import { createModelCallOptions } from "../mastra/model-call";
import { classifyModelError } from "../mastra/model-errors";
import { type ModelSelection, models, respondingModelOf } from "../mastra/models";
import { CONVERSATION_ID_KEY, EMPLOYEE_ID_KEY } from "../mastra/request-context";
import { type AgentToolDeps, createAgentTools } from "../mastra/tools/agent";
import { type ChatTurn, recordAgentReply } from "../services/conversations/chat-turn";
import type { ConversationServiceDeps } from "../services/conversations/conversation-service";
import { appendMessage } from "../services/conversations/conversation-service";
import { extractText, hasReplyContent } from "../services/conversations/history";
import type { DecisionService } from "../services/decisions/decision-service";
import type { TriageOutcome } from "./triage-runner";
import type { TurnPlan } from "./turn-planner";

export type ReplyStream = ReturnType<typeof createUIMessageStream<UIMessage>>;

export interface ReplyDeps extends AgentToolDeps {
  readonly conversations: ConversationServiceDeps;
  readonly decisions: DecisionService;
  readonly clock: Clock;
  readonly supportModel?: ModelSelection;
}

export const STREAM_FAILURE_MESSAGE =
  "Não consegui concluir a resposta agora. Nada foi criado ou alterado; tente novamente.";

type FixedReplyPlan = Extract<TurnPlan, { kind: "fixed_reply" }>;
type AnswerPlan = Extract<TurnPlan, { kind: "answer" }>;

interface AnswerContext {
  readonly triage: TriageOutcome;
  readonly plan: AnswerPlan;
  readonly startedAt: number;
}

export const withFallbackText = (reply: UIMessage): UIMessage =>
  hasReplyContent(reply) && extractText(reply) === ""
    ? { ...reply, parts: [...reply.parts, { type: "text", text: STREAM_FAILURE_MESSAGE }] }
    : reply;

const toStreamErrorMessage = (error: unknown): string =>
  classifyModelError(error)?.message ?? STREAM_FAILURE_MESSAGE;

const buildRequestContext = (turn: ChatTurn): RequestContext =>
  new RequestContext([
    [EMPLOYEE_ID_KEY, turn.ref.ownerId],
    [CONVERSATION_ID_KEY, turn.ref.conversationId],
  ]);

const sumTokens = (first: number | null, second: number | null | undefined): number | null =>
  first === null && (second ?? null) === null ? null : (first ?? 0) + (second ?? 0);

export const streamFixedReply = async (
  deps: ReplyDeps,
  turn: ChatTurn,
  plan: FixedReplyPlan,
  triage: TriageOutcome,
): Promise<ReplyStream> => {
  const stored = await appendMessage(deps.conversations, turn.ref, {
    authorKind: "agent",
    content: plan.text,
    parts: [{ type: "text", text: plan.text }],
  });

  await deps.decisions.record({
    messageId: stored.id,
    triage: triage.triage,
    action: plan.action,
    toolCalls: [],
    tokensIn: triage.tokensIn,
    tokensOut: triage.tokensOut,
    latencyMs: triage.latencyMs,
    model: triage.model,
  });

  return createUIMessageStream<UIMessage>({
    execute: ({ writer }) => {
      writer.write({ type: "start", messageId: stored.id });
      writer.write({ type: "text-start", id: stored.id });
      writer.write({ type: "text-delta", id: stored.id, delta: plan.text });
      writer.write({ type: "text-end", id: stored.id });
      writer.write({ type: "finish" });
    },
  });
};

const recordAnswerDecision = async (
  deps: ReplyDeps,
  output: Awaited<ReturnType<ReturnType<typeof createSupportAgent>["stream"]>>,
  context: AnswerContext,
  messageId: string,
): Promise<void> => {
  const [usage, toolCalls, response] = await Promise.all([
    output.usage,
    output.toolCalls,
    output.response,
  ]);
  const { triage, plan, startedAt } = context;

  await deps.decisions.record({
    messageId,
    triage: triage.triage,
    action: plan.action,
    toolCalls: toolCalls.map(({ payload }) => ({ name: payload.toolName, args: payload.args })),
    tokensIn: sumTokens(triage.tokensIn, usage.inputTokens),
    tokensOut: sumTokens(triage.tokensOut, usage.outputTokens),
    latencyMs: triage.latencyMs + (deps.clock.now().getTime() - startedAt),
    model: respondingModelOf(response, models.support),
  });
};

export const streamAnswer = async (
  deps: ReplyDeps,
  turn: ChatTurn,
  plan: AnswerPlan,
  triage: TriageOutcome,
): Promise<ReplyStream> => {
  const context = { triage, plan, startedAt: deps.clock.now().getTime() };
  const agent = createSupportAgent({
    tools: createAgentTools(deps),
    toolNames: plan.toolNames,
    offerAnalyst: plan.offerAnalyst,
    ...(deps.supportModel ? { model: deps.supportModel } : {}),
  });
  const originalMessages = [...turn.history];
  const output = await agent.stream(originalMessages, {
    ...createModelCallOptions(),
    requestContext: buildRequestContext(turn),
  });

  return createUIMessageStream<UIMessage>({
    originalMessages,
    onError: toStreamErrorMessage,
    execute: ({ writer }) => {
      writer.merge(
        toAISdkStream(output, { from: "agent", version: "v7", onError: toStreamErrorMessage }),
      );
    },
    onEnd: async ({ responseMessage }) => {
      const stored = await recordAgentReply(
        deps.conversations,
        turn.ref,
        withFallbackText(responseMessage),
      );

      if (stored) {
        await recordAnswerDecision(deps, output, context, stored.id);
      }
    },
  });
};
