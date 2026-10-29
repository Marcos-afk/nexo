import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";
import { CHAT_ENDPOINT } from "@/constants/chat";
import { createChatFetch } from "@/lib/chat-fetch";
import { useAssistantStatusContext } from "@/providers/assistant-status-provider";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { countEmployeeMessages, toChatLine } from "@/utils/chat-lines";
import { counterOf, isComposerDisabled, noticeOf, placeholderOf } from "@/utils/chat-state";
import { errorMessageOf } from "@/utils/error-message";
import { useChatScroll } from "./use-chat-scroll";

const REPLY_ERROR_FALLBACK = "Tente de novo em instantes.";

export function useChatPanel(initialMessages: UIMessage[], initialSession: ChatSession) {
  const [mode, setMode] = useState(initialSession.mode);
  const { status: assistantStatus } = useAssistantStatusContext();
  const { messages, sendMessage, regenerate, status, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: CHAT_ENDPOINT, fetch: createChatFetch(setMode) }),
  });

  const lines = messages.map(toChatLine);
  const lastLine = lines.at(-1);
  const sentNow = countEmployeeMessages(messages) - countEmployeeMessages(initialMessages);
  const messageCount = initialSession.employeeMessageCount + Math.max(0, sentNow);
  const isLimitReached = messageCount >= initialSession.messageLimit;
  const isTyping =
    status === "submitted" ||
    (status === "streaming" && lastLine?.authorKind === "agent" && lastLine.text === "");
  const endRef = useChatScroll(`${lines.length}:${lastLine?.text.length ?? 0}:${isTyping}`);
  const chatState = { isLimitReached, assistantStatus, mode };

  return {
    lines,
    endRef,
    isTyping,
    isEmpty: lines.length === 0,
    isBusy: status === "submitted" || status === "streaming",
    replyError: error ? errorMessageOf(error, REPLY_ERROR_FALLBACK) : null,
    counter: counterOf(messageCount, initialSession.messageLimit),
    notice: noticeOf(chatState),
    isComposerDisabled: isComposerDisabled(chatState),
    placeholder: placeholderOf(chatState),
    sendText: (text: string) => void sendMessage({ text }),
    retry: () => void regenerate(),
  };
}
