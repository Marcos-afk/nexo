import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { z } from "zod";
import { CHAT_ACTION_LABELS } from "@/constants/chat";
import { type MessageAuthorKind, messageAuthorKinds } from "@/domain/conversation";
import type { ChatActionProps, ChatActionStatusType, ChatLineProps } from "@/models/chat";
import { messageTextOf } from "@/utils/message-text";

type ToolPart = Parameters<typeof getToolName>[0];

const metadataSchema = z.object({ authorKind: z.enum(messageAuthorKinds) });
const failureOutputSchema = z.object({ error: z.string() });

const AUTHOR_KIND_BY_ROLE = {
  user: "employee",
  assistant: "agent",
  system: "system",
} as const satisfies Record<UIMessage["role"], MessageAuthorKind>;

const authorKindOf = (message: UIMessage): MessageAuthorKind => {
  const metadata = metadataSchema.safeParse(message.metadata);

  return metadata.success ? metadata.data.authorKind : AUTHOR_KIND_BY_ROLE[message.role];
};

const statusOf = (part: ToolPart): ChatActionStatusType => {
  if (part.state === "output-error") {
    return "failed";
  }

  if (part.state !== "output-available") {
    return "running";
  }

  return failureOutputSchema.safeParse(part.output).success ? "failed" : "done";
};

const actionOf = (part: ToolPart): ChatActionProps[] => {
  const label = CHAT_ACTION_LABELS[getToolName(part)];

  return label === undefined ? [] : [{ key: part.toolCallId, label, status: statusOf(part) }];
};

export const actionsOf = (message: UIMessage): ChatActionProps[] =>
  message.parts.flatMap((part) => (isToolUIPart(part) ? actionOf(part) : []));

export const toChatLine = (message: UIMessage): ChatLineProps => ({
  id: message.id,
  authorKind: authorKindOf(message),
  text: messageTextOf(message),
  actions: actionsOf(message),
});

export const countEmployeeMessages = (messages: readonly UIMessage[]): number =>
  messages.filter((message) => message.role === "user").length;
