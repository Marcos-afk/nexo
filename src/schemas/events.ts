import { z } from "zod";
import { conversationModes, messageAuthorKinds } from "@/domain/conversation";

export const messageCreatedEventSchema = z.object({ authorKind: z.enum(messageAuthorKinds) });

export const conversationUpdatedEventSchema = z.object({ mode: z.enum(conversationModes) });
