import type { UIMessage } from "ai";
import { ChatPanel } from "@/components/features/chat-panel";
import { getContainer } from "@/server/container";
import { findSession } from "@/server/session";
import { loadActiveConversationMessages } from "@/services/conversations/chat-turn";

async function fetchChatHistory(): Promise<UIMessage[]> {
  const { auth, chat } = await getContainer();
  const session = await findSession(auth);

  return session ? loadActiveConversationMessages(chat.conversations, session.user.id) : [];
}

export default async function Chat() {
  return <ChatPanel initialMessages={await fetchChatHistory()} />;
}
