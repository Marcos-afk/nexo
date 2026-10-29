import { createUIMessageStreamResponse, safeValidateUIMessages } from "ai";
import { z } from "zod";
import { type ChatReply, handleChatMessage } from "@/conversation/chat-orchestrator";
import { getChatDeps } from "@/server/container";
import { getSessionEmployeeId } from "@/server/session";
import { loadActiveConversationMessages } from "@/services/conversations/chat-turn";
import { extractText } from "@/services/conversations/history";
import { toErrorResponse } from "./error-response";

export const dynamic = "force-dynamic";

const HTTP_ACCEPTED = 202;
const HTTP_BAD_REQUEST = 400;
const INVALID_BODY_MESSAGE = "Corpo da requisição inválido.";
const INVALID_MESSAGES_MESSAGE = "Mensagens inválidas.";
const EMPTY_MESSAGE_TEXT = "A mensagem não pode ficar vazia.";

const bodySchema = z.object({ messages: z.array(z.unknown()).min(1) });

const badRequest = (message: string): Response =>
  Response.json({ error: message }, { status: HTTP_BAD_REQUEST });

const parseLastUserText = async (request: Request): Promise<string | Response> => {
  const body = bodySchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return badRequest(INVALID_BODY_MESSAGE);
  }

  const validated = await safeValidateUIMessages({ messages: body.data.messages });
  const last = validated.success ? validated.data.at(-1) : undefined;

  if (last?.role !== "user") {
    return badRequest(INVALID_MESSAGES_MESSAGE);
  }

  const text = extractText(last).trim();

  return text.length > 0 ? text : badRequest(EMPTY_MESSAGE_TEXT);
};

const toResponse = (reply: ChatReply): Response =>
  reply.kind === "stream"
    ? createUIMessageStreamResponse({ stream: reply.stream })
    : Response.json({ mode: reply.mode }, { status: HTTP_ACCEPTED });

export async function GET(): Promise<Response> {
  const deps = await getChatDeps();

  return Response.json(
    await loadActiveConversationMessages(deps.conversations, getSessionEmployeeId()),
  );
}

export async function POST(request: Request): Promise<Response> {
  const text = await parseLastUserText(request);

  if (text instanceof Response) {
    return text;
  }

  try {
    const deps = await getChatDeps();

    return toResponse(await handleChatMessage(deps, getSessionEmployeeId(), text));
  } catch (error) {
    const response = toErrorResponse(error);

    if (response) {
      return response;
    }

    throw error;
  }
}
