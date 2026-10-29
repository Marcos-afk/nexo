import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";
import { CHAT_ENDPOINT } from "@/constants/chat";
import { createChatFetch } from "@/lib/chat-fetch";
import { useAssistantStatusContext } from "@/providers/assistant-status-provider";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { countEmployeeMessages, toChatLine, withChoiceAnswers } from "@/utils/chat-lines";
import { chatViewOf } from "@/utils/chat-view";
import { errorMessageOf } from "@/utils/error-message";
import { useAnalystRequest } from "./use-analyst-request";
import { useChatScroll } from "./use-chat-scroll";

const REPLY_ERROR_FALLBACK = "Tente de novo em instantes.";

export function useChatPanel(initialMessages: UIMessage[], session: ChatSession) {
  const [mode, setMode] = useState(session.mode);
  const { status: assistantStatus } = useAssistantStatusContext();
  const { messages, sendMessage, regenerate, status, error } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: CHAT_ENDPOINT, fetch: createChatFetch(setMode) }),
  });
  const lines = withChoiceAnswers(messages.map(toChatLine));
  const view = chatViewOf({
    lines,
    status,
    assistantStatus,
    mode,
    sentCount: countEmployeeMessages(messages) - countEmployeeMessages(initialMessages),
    employeeMessageCount: session.employeeMessageCount,
    messageLimit: session.messageLimit,
  });

  const scroll = useChatScroll(view.scrollKey);
  const analyst = useAnalystRequest(setMode);

  return {
    ...view,
    ...scroll,
    ...analyst,
    lines,
    replyError: error ? errorMessageOf(error, REPLY_ERROR_FALLBACK) : null,
    sendText: (text: string) => void sendMessage({ text }),
    retry: () => void regenerate(),
  };
}
