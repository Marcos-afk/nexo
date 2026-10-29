import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { CHAT_ENDPOINT } from "@/constants/chat";
import { createChatFetch } from "@/lib/chat-fetch";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { useChatSession } from "./use-chat-session";
import { useChatSync } from "./use-chat-sync";

export function useChatConversation(initialMessages: UIMessage[], session: ChatSession) {
  const chatSession = useChatSession(session, initialMessages);
  const chat = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: CHAT_ENDPOINT,
      fetch: createChatFetch(chatSession.setMode),
    }),
  });

  useChatSync({
    status: chat.status,
    setMessages: chat.setMessages,
    onMode: chatSession.setMode,
    onResync: chatSession.reset,
  });

  return { chat, chatSession };
}
