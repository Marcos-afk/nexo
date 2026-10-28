import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { conversationModes } from "../../../domain/conversation";
import { handoffInputSchema } from "../../../domain/handoff";
import { readConversationId, readEmployeeId } from "../../request-context";
import { type AgentToolDeps, runTool, withFailure } from "./tool-support";

export const createRequestHandoffTool = ({ handoff }: AgentToolDeps) =>
  createTool({
    id: "requestHandoff",
    description:
      "Transfere a conversa para um analista humano, levando um resumo do caso. Use quando o funcionário pedir, em caso crítico, com chamado vencido ou quando você não tiver segurança. Depois disso o agent para de responder nesta conversa.",
    inputSchema: handoffInputSchema,
    outputSchema: withFailure(
      z.object({
        mode: z.enum(conversationModes),
        contactDueAt: z.string().nullable(),
      }),
    ),
    execute: (input, { requestContext }) =>
      runTool(async () => {
        const conversation = await handoff.request(
          readEmployeeId(requestContext),
          readConversationId(requestContext),
          input,
        );

        return {
          mode: conversation.mode,
          contactDueAt: conversation.contactDueAt?.toISOString() ?? null,
        };
      }),
  });
