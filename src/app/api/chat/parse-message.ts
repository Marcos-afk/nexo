import { safeValidateUIMessages } from "ai";
import { z } from "zod";
import { MAX_CHAT_MESSAGE_LENGTH, MAX_CHAT_MESSAGES } from "@/domain/input-limits";
import { extractText } from "@/services/conversations/history";

const HTTP_BAD_REQUEST = 400;
const INVALID_BODY_MESSAGE = "Corpo da requisição inválido.";
const INVALID_MESSAGES_MESSAGE = "Mensagens inválidas.";
const EMPTY_MESSAGE_TEXT = "A mensagem não pode ficar vazia.";
export const LONG_MESSAGE_TEXT = `A mensagem pode ter até ${MAX_CHAT_MESSAGE_LENGTH} caracteres.`;

const bodySchema = z.object({ messages: z.array(z.unknown()).min(1).max(MAX_CHAT_MESSAGES) });

const badRequest = (message: string): Response =>
  Response.json({ error: message }, { status: HTTP_BAD_REQUEST });

export const parseLastUserText = async (request: Request): Promise<string | Response> => {
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

  if (text.length === 0) {
    return badRequest(EMPTY_MESSAGE_TEXT);
  }

  return text.length > MAX_CHAT_MESSAGE_LENGTH ? badRequest(LONG_MESSAGE_TEXT) : text;
};
