import { safeValidateUIMessages, type UIMessage } from "ai";
import { z } from "zod";
import { CHAT_ENDPOINT, CHAT_SESSION_ENDPOINT } from "@/constants/chat";
import { chatSessionResponseSchema } from "@/schemas/chat";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { ApiError, api } from "./api";

const HTTP_OK = 200;
const INVALID_HISTORY_MESSAGE = "Não foi possível atualizar a conversa.";

export const fetchChatHistory = async (): Promise<UIMessage[]> => {
  const raw = await api.get(CHAT_ENDPOINT, z.array(z.unknown()));
  const validated = await safeValidateUIMessages({ messages: raw });

  if (!validated.success) {
    throw new ApiError(HTTP_OK, INVALID_HISTORY_MESSAGE, { cause: validated.error });
  }

  return validated.data;
};

export const fetchChatSession = async (): Promise<ChatSession> => {
  const { session } = await api.get(CHAT_SESSION_ENDPOINT, chatSessionResponseSchema);

  return session;
};
