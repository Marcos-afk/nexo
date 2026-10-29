import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { z } from "zod";
import { type ConversationMode, conversationModes } from "@/domain/conversation";
import { apiErrorOf } from "./api";

const HTTP_ACCEPTED = 202;

const skippedBodySchema = z.object({ mode: z.enum(conversationModes) });

const emptyReplyResponse = (): Response =>
  createUIMessageStreamResponse({ stream: createUIMessageStream({ execute: () => undefined }) });

export const createChatFetch =
  (onSkipped: (mode: ConversationMode) => void): typeof fetch =>
  async (input, init) => {
    const response = await fetch(input, init);

    if (response.status === HTTP_ACCEPTED) {
      const body = skippedBodySchema.safeParse(await response.json().catch(() => null));

      if (body.success) {
        onSkipped(body.data.mode);
      }

      return emptyReplyResponse();
    }

    if (!response.ok) {
      throw await apiErrorOf(response);
    }

    return response;
  };
