import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { mastra } from "@/mastra";
import { EMPLOYEE_ID_KEY } from "@/mastra/request-context";
import { readMessages, writeMessages } from "@/services/conversations/message-store";

export const dynamic = "force-dynamic";

const SESSION_EMPLOYEE_ID = "emp-ana";
const SUPPORT_AGENT_ID = "supportAgent";
const HTTP_BAD_REQUEST = 400;
const EMPTY_STEP_PART_TYPE = "step-start";
const INVALID_BODY_MESSAGE = "Corpo da requisição inválido.";
const INVALID_MESSAGES_MESSAGE = "Mensagens inválidas.";

const bodySchema = z.object({ messages: z.array(z.unknown()).min(1) });

const badRequest = (message: string): Response =>
  Response.json({ error: message }, { status: HTTP_BAD_REQUEST });

const buildRequestContext = (employeeId: string): RequestContext =>
  new RequestContext([[EMPLOYEE_ID_KEY, employeeId]]);

const parseMessages = async (request: Request): Promise<UIMessage[] | Response> => {
  const body = bodySchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return badRequest(INVALID_BODY_MESSAGE);
  }

  const validated = await safeValidateUIMessages({ messages: body.data.messages });

  return validated.success ? validated.data : badRequest(INVALID_MESSAGES_MESSAGE);
};

const hasReplyContent = (message: UIMessage): boolean =>
  message.parts.some((part) => part.type !== EMPTY_STEP_PART_TYPE);

const selectMessagesToPersist = (
  originalMessages: UIMessage[],
  messages: UIMessage[],
  responseMessage: UIMessage,
): UIMessage[] => (hasReplyContent(responseMessage) ? messages : originalMessages);

const streamAgentReply = async (
  employeeId: string,
  originalMessages: UIMessage[],
): Promise<Response> => {
  const agentStream = await handleChatStream({
    mastra,
    agentId: SUPPORT_AGENT_ID,
    version: "v7",
    params: { messages: originalMessages, requestContext: buildRequestContext(employeeId) },
  });

  const stream = createUIMessageStream({
    originalMessages,
    execute: ({ writer }) => {
      writer.merge(agentStream);
    },
    onEnd: ({ messages, responseMessage }) =>
      writeMessages(
        employeeId,
        selectMessagesToPersist(originalMessages, messages, responseMessage),
      ),
  });

  return createUIMessageStreamResponse({ stream });
};

export async function GET(): Promise<Response> {
  return Response.json(await readMessages(SESSION_EMPLOYEE_ID));
}

export async function POST(request: Request): Promise<Response> {
  const messages = await parseMessages(request);

  if (messages instanceof Response) {
    return messages;
  }

  return streamAgentReply(SESSION_EMPLOYEE_ID, messages);
}
