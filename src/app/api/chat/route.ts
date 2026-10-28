import { handleChatStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { SessionMessageLimitReachedError } from "@/domain/errors";
import { shouldInvokeAgent } from "@/domain/turn-policy";
import { mastra } from "@/mastra";
import { EMPLOYEE_ID_KEY } from "@/mastra/request-context";
import { getServiceDeps } from "@/server/container";
import { getSessionEmployeeId } from "@/server/session";
import {
  beginChatTurn,
  type ChatTurn,
  loadActiveConversationMessages,
  recordAgentReply,
} from "@/services/conversations/chat-turn";
import type { ConversationServiceDeps } from "@/services/conversations/conversation-service";
import { extractText } from "@/services/conversations/history";

export const dynamic = "force-dynamic";

const SUPPORT_AGENT_ID = "supportAgent";
const HTTP_ACCEPTED = 202;
const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;
const INVALID_BODY_MESSAGE = "Corpo da requisição inválido.";
const INVALID_MESSAGES_MESSAGE = "Mensagens inválidas.";
const EMPTY_MESSAGE_TEXT = "A mensagem não pode ficar vazia.";
const MESSAGE_LIMIT_CODE = "session_message_limit_reached";

const bodySchema = z.object({ messages: z.array(z.unknown()).min(1) });

const badRequest = (message: string): Response =>
  Response.json({ error: message }, { status: HTTP_BAD_REQUEST });

const buildRequestContext = (employeeId: string): RequestContext =>
  new RequestContext([[EMPLOYEE_ID_KEY, employeeId]]);

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

const streamAgentReply = async (
  deps: ConversationServiceDeps,
  employeeId: string,
  turn: ChatTurn,
): Promise<Response> => {
  const originalMessages = [...turn.history];
  const agentStream = await handleChatStream({
    mastra,
    agentId: SUPPORT_AGENT_ID,
    version: "v7",
    params: { messages: originalMessages, requestContext: buildRequestContext(employeeId) },
  });

  const stream = createUIMessageStream<UIMessage>({
    originalMessages,
    execute: ({ writer }) => {
      writer.merge(agentStream);
    },
    onEnd: ({ responseMessage }) => recordAgentReply(deps, turn.ref, responseMessage),
  });

  return createUIMessageStreamResponse({ stream });
};

const messageLimitResponse = (error: SessionMessageLimitReachedError): Response =>
  Response.json(
    { error: error.message, code: MESSAGE_LIMIT_CODE },
    { status: HTTP_TOO_MANY_REQUESTS },
  );

const startTurn = async (
  deps: ConversationServiceDeps,
  employeeId: string,
  text: string,
): Promise<ChatTurn | Response> => {
  try {
    return await beginChatTurn(deps, employeeId, text);
  } catch (error) {
    if (error instanceof SessionMessageLimitReachedError) {
      return messageLimitResponse(error);
    }

    throw error;
  }
};

export async function GET(): Promise<Response> {
  const deps = await getServiceDeps();

  return Response.json(await loadActiveConversationMessages(deps, getSessionEmployeeId()));
}

export async function POST(request: Request): Promise<Response> {
  const text = await parseLastUserText(request);

  if (text instanceof Response) {
    return text;
  }

  const deps = await getServiceDeps();
  const employeeId = getSessionEmployeeId();
  const turn = await startTurn(deps, employeeId, text);

  if (turn instanceof Response) {
    return turn;
  }

  return shouldInvokeAgent(turn.mode)
    ? streamAgentReply(deps, employeeId, turn)
    : Response.json({ mode: turn.mode }, { status: HTTP_ACCEPTED });
}
