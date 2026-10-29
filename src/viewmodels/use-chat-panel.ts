import type { UIMessage } from "ai";
import { useAssistantStatusContext } from "@/providers/assistant-status-provider";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { countEmployeeMessages, toChatLine, withChoiceAnswers } from "@/utils/chat-lines";
import { chatViewOf } from "@/utils/chat-view";
import { errorMessageOf } from "@/utils/error-message";
import { useAnalystRequest } from "./use-analyst-request";
import { useChatConversation } from "./use-chat-conversation";
import { useChatScroll } from "./use-chat-scroll";

const REPLY_ERROR_FALLBACK = "Tente de novo em instantes.";

export function useChatPanel(initialMessages: UIMessage[], session: ChatSession) {
  const { chat, chatSession } = useChatConversation(initialMessages, session);
  const { status: assistantStatus } = useAssistantStatusContext();
  const lines = withChoiceAnswers(chat.messages.map(toChatLine));
  const view = chatViewOf({
    lines,
    assistantStatus,
    status: chat.status,
    mode: chatSession.mode,
    sentCount: countEmployeeMessages(chat.messages) - chatSession.base.userMessages,
    employeeMessageCount: chatSession.base.count,
    messageLimit: session.messageLimit,
  });
  const scroll = useChatScroll(view.scrollKey);
  const analyst = useAnalystRequest(chatSession.setMode);

  return {
    ...view,
    ...scroll,
    ...analyst,
    lines,
    replyError: chat.error ? errorMessageOf(chat.error, REPLY_ERROR_FALLBACK) : null,
    sendText: (text: string) => void chat.sendMessage({ text }),
    retry: () => void chat.regenerate(),
  };
}
