import type { UIMessage } from "ai";
import type { ConversationMode } from "../../domain/conversation";
import { SessionMessageLimitReachedError } from "../../domain/errors";
import {
  appendMessage,
  type Conversation,
  type ConversationRef,
  type ConversationServiceDeps,
  countEmployeeMessages,
  getActiveConversation,
  listMessages,
  type Message,
  startConversation,
} from "./conversation-service";
import {
  AGENT_HISTORY_WINDOW,
  extractText,
  hasReplyContent,
  SESSION_MESSAGE_LIMIT,
  toAgentHistory,
  toUiMessages,
} from "./history";

const TEXT_PART_TYPE = "text";

export interface ChatTurn {
  readonly ref: ConversationRef;
  readonly mode: ConversationMode;
  readonly history: readonly UIMessage[];
}

const resolveConversation = async (
  deps: ConversationServiceDeps,
  ownerId: string,
): Promise<Conversation> =>
  (await getActiveConversation(deps, ownerId)) ?? startConversation(deps, ownerId);

const requireBelowLimit = async (
  deps: ConversationServiceDeps,
  ref: ConversationRef,
): Promise<void> => {
  const sent = await countEmployeeMessages(deps, ref);

  if (sent >= SESSION_MESSAGE_LIMIT) {
    throw new SessionMessageLimitReachedError(SESSION_MESSAGE_LIMIT);
  }
};

export const beginChatTurn = async (
  deps: ConversationServiceDeps,
  ownerId: string,
  text: string,
): Promise<ChatTurn> => {
  const conversation = await resolveConversation(deps, ownerId);
  const ref = { ownerId, conversationId: conversation.id };

  await requireBelowLimit(deps, ref);
  await appendMessage(deps, ref, {
    authorKind: "employee",
    content: text,
    parts: [{ type: TEXT_PART_TYPE, text }],
  });

  const stored = await listMessages(deps, ref, AGENT_HISTORY_WINDOW * 2);

  return { ref, mode: conversation.mode, history: await toAgentHistory(ownerId, stored) };
};

export const recordAgentReply = async (
  deps: ConversationServiceDeps,
  ref: ConversationRef,
  reply: UIMessage,
): Promise<Message | null> => {
  if (!hasReplyContent(reply)) {
    return null;
  }

  return appendMessage(deps, ref, {
    authorKind: "agent",
    content: extractText(reply),
    parts: reply.parts,
  });
};

export const loadActiveConversationMessages = async (
  deps: ConversationServiceDeps,
  ownerId: string,
): Promise<UIMessage[]> => {
  const conversation = await getActiveConversation(deps, ownerId);

  if (!conversation) {
    return [];
  }

  const stored = await listMessages(deps, { ownerId, conversationId: conversation.id });

  return toUiMessages(ownerId, stored);
};
