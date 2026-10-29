import type { ChatStatus } from "ai";
import type { ConversationMode } from "@/domain/conversation";
import type { AssistantStatus } from "@/domain/health";
import type { ChatLineProps } from "@/models/chat";
import { counterOf, isComposerDisabled, noticeOf, placeholderOf } from "@/utils/chat-state";

interface ChatViewInput {
  readonly lines: readonly ChatLineProps[];
  readonly sentCount: number;
  readonly employeeMessageCount: number;
  readonly messageLimit: number;
  readonly status: ChatStatus;
  readonly assistantStatus: AssistantStatus | null;
  readonly mode: ConversationMode;
}

const isReplyPending = (status: ChatStatus, last: ChatLineProps | undefined): boolean =>
  status === "submitted" ||
  (status === "streaming" && last?.authorKind === "agent" && last.text === "");

export const chatViewOf = (input: ChatViewInput) => {
  const { lines, status, assistantStatus, mode, messageLimit } = input;
  const last = lines.at(-1);
  const messageCount = input.employeeMessageCount + Math.max(0, input.sentCount);
  const isTyping = isReplyPending(status, last);
  const state = { isLimitReached: messageCount >= messageLimit, assistantStatus, mode };

  return {
    isTyping,
    isEmpty: lines.length === 0,
    isBusy: status === "submitted" || status === "streaming",
    scrollKey: `${lines.length}:${last?.text.length ?? 0}:${isTyping}`,
    counter: counterOf(messageCount, messageLimit),
    notice: noticeOf(state),
    isComposerDisabled: isComposerDisabled(state),
    placeholder: placeholderOf(state),
  };
};
