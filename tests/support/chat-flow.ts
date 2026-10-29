import {
  type ChatOrchestratorDeps,
  type ChatReply,
  handleChatMessage,
} from "../../src/conversation/chat-orchestrator";
import {
  createConversationService,
  type Message,
} from "../../src/services/conversations/conversation-service";

export const sendAs = async (
  deps: ChatOrchestratorDeps,
  employeeId: string,
  text: string,
): Promise<ChatReply> => {
  const reply = await handleChatMessage(deps, employeeId, text);

  if (reply.kind === "stream") {
    await reply.stream.pipeTo(new WritableStream());
  }

  return reply;
};

export const activeConversationOf = async (deps: ChatOrchestratorDeps, employeeId: string) => {
  const conversation = await createConversationService(deps.conversations).getActive(employeeId);

  if (!conversation) {
    throw new Error(`no active conversation for ${employeeId}`);
  }

  return conversation;
};

export const agentMessagesOf = async (
  deps: ChatOrchestratorDeps,
  employeeId: string,
): Promise<readonly Message[]> => {
  const conversation = await activeConversationOf(deps, employeeId);
  const stored = await createConversationService(deps.conversations).listMessages({
    ownerId: employeeId,
    conversationId: conversation.id,
  });

  return stored.filter((message) => message.authorKind === "agent");
};

export const decisionOf = async (deps: ChatOrchestratorDeps, messageId: string | undefined) =>
  (await deps.conversations.database.query.decisions.findMany()).find(
    (decision) => decision.messageId === messageId,
  );

interface StoredPart {
  readonly type: string;
  readonly output?: unknown;
}

export const toolOutputsOf = (message: Message | undefined, toolName: string): readonly unknown[] =>
  ((message?.parts ?? []) as readonly StoredPart[])
    .filter((part) => part.type === `tool-${toolName}`)
    .map((part) => part.output);

export const lastAgentMessageOf = async (
  deps: ChatOrchestratorDeps,
  employeeId: string,
): Promise<Message | undefined> => (await agentMessagesOf(deps, employeeId)).at(-1);
