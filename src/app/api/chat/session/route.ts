import { withSession } from "@/app/api/with-auth";
import { loadChatSession } from "@/services/conversations/chat-turn";

export const dynamic = "force-dynamic";

export const GET = withSession(async (_request, { session, container }) =>
  Response.json({ session: await loadChatSession(container.chat.conversations, session.user.id) }),
);
