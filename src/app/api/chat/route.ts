import { createUIMessageStreamResponse } from "ai";
import { type ChatReply, handleChatMessage } from "@/conversation/chat-orchestrator";
import { loadActiveConversationMessages } from "@/services/conversations/chat-turn";
import { withSession } from "../with-auth";
import { parseLastUserText } from "./parse-message";

export const dynamic = "force-dynamic";

const HTTP_ACCEPTED = 202;

const toResponse = (reply: ChatReply): Response =>
  reply.kind === "stream"
    ? createUIMessageStreamResponse({ stream: reply.stream })
    : Response.json({ mode: reply.mode }, { status: HTTP_ACCEPTED });

export const GET = withSession(async (_request, { session, container }) =>
  Response.json(
    await loadActiveConversationMessages(container.chat.conversations, session.user.id),
  ),
);

export const POST = withSession(async (request, { session, container }) => {
  const text = await parseLastUserText(request);

  return text instanceof Response
    ? text
    : toResponse(await handleChatMessage(container.chat, session.user.id, text));
});
