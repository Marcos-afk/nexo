import { safeValidateUIMessages, type UIMessage } from "ai";
import type { MessageAuthorKind } from "../../domain/conversation";
import { StoredConversationInvalidError } from "../../domain/errors";
import type { Message } from "./conversation-service";

export const SESSION_MESSAGE_LIMIT = 30;
export const AGENT_HISTORY_WINDOW = 20;

const TEXT_PART_TYPE = "text";
const EMPTY_STEP_PART_TYPE = "step-start";

const roleByAuthorKind = {
  employee: "user",
  agent: "assistant",
  analyst: "assistant",
  system: "assistant",
} as const satisfies Record<MessageAuthorKind, UIMessage["role"]>;

const agentVisibleKinds: ReadonlySet<MessageAuthorKind> = new Set(["employee", "agent"]);

const toCandidate = (message: Message) => ({
  id: message.id,
  role: roleByAuthorKind[message.authorKind],
  parts: message.parts ?? [{ type: TEXT_PART_TYPE, text: message.content }],
});

export const toUiMessages = async (
  ownerId: string,
  messages: readonly Message[],
): Promise<UIMessage[]> => {
  const validated = await safeValidateUIMessages({ messages: messages.map(toCandidate) });

  if (!validated.success) {
    throw new StoredConversationInvalidError(ownerId, { cause: validated.error });
  }

  return validated.data;
};

const dropLeadingNonEmployee = (messages: readonly Message[]): readonly Message[] => {
  const firstEmployeeIndex = messages.findIndex((message) => message.authorKind === "employee");

  return firstEmployeeIndex < 0 ? [] : messages.slice(firstEmployeeIndex);
};

export const selectAgentHistory = (messages: readonly Message[]): readonly Message[] =>
  dropLeadingNonEmployee(
    messages
      .filter((message) => agentVisibleKinds.has(message.authorKind))
      .slice(-AGENT_HISTORY_WINDOW),
  );

export const toAgentHistory = (
  ownerId: string,
  messages: readonly Message[],
): Promise<UIMessage[]> => toUiMessages(ownerId, selectAgentHistory(messages));

export const extractText = (message: UIMessage): string =>
  message.parts.flatMap((part) => (part.type === TEXT_PART_TYPE ? [part.text] : [])).join("");

export const hasReplyContent = (message: UIMessage): boolean =>
  message.parts.some((part) => part.type !== EMPTY_STEP_PART_TYPE);
