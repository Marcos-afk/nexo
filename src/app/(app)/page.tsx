import type { UIMessage } from "ai";
import { ChatPanel } from "@/components/features/chat/chat-panel";
import { getContainer } from "@/server/container";
import { findSession } from "@/server/session";
import {
  type ChatSession,
  loadActiveConversationMessages,
  loadChatSession,
} from "@/services/conversations/chat-turn";
import { SESSION_MESSAGE_LIMIT } from "@/services/conversations/history";

const EMPTY_SESSION: ChatSession = {
  mode: "agent",
  employeeMessageCount: 0,
  messageLimit: SESSION_MESSAGE_LIMIT,
};

async function fetchChatHistory(): Promise<UIMessage[]> {
  const { auth, chat } = await getContainer();
  const session = await findSession(auth);

  return session ? loadActiveConversationMessages(chat.conversations, session.user.id) : [];
}

async function fetchChatSession(): Promise<ChatSession> {
  const { auth, chat } = await getContainer();
  const session = await findSession(auth);

  return session ? loadChatSession(chat.conversations, session.user.id) : EMPTY_SESSION;
}

export default async function Chat() {
  const [messages, session] = await Promise.all([fetchChatHistory(), fetchChatSession()]);

  return (
    <>
      <h1 className="sr-only">Atendimento</h1>
      <ChatPanel initialMessages={messages} initialSession={session} />
    </>
  );
}
