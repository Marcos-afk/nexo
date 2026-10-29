import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { z } from "zod";
import { CHAT_ACTION_LABELS } from "@/constants/chat";
import { type MessageAuthorKind, messageAuthorKinds } from "@/domain/conversation";
import type {
  ChatActionProps,
  ChatActionStatusType,
  ChatAnalystProps,
  ChatAttachmentProps,
  ChatLineProps,
} from "@/models/chat";
import {
  buildDraftOutputSchema,
  getTicketOutputSchema,
  listTicketsOutputSchema,
  offerChoicesOutputSchema,
} from "@/schemas/chat";
import { messageTextOf } from "@/utils/message-text";

type ToolPart = Parameters<typeof getToolName>[0];
type AttachmentParser = (output: unknown, key: string) => ChatAttachmentProps[];

const metadataSchema = z.object({
  authorKind: z.enum(messageAuthorKinds),
  authorName: z.string().optional(),
  authorLevel: z.string().nullable().optional(),
});
const failureOutputSchema = z.object({ error: z.string() });

const AUTHOR_KIND_BY_ROLE = {
  user: "employee",
  assistant: "agent",
  system: "system",
} as const satisfies Record<UIMessage["role"], MessageAuthorKind>;

const ATTACHMENT_PARSERS: Readonly<Record<string, AttachmentParser>> = {
  buildDraft: (output, key) => {
    const parsed = buildDraftOutputSchema.safeParse(output);

    return parsed.success ? [{ kind: "draft", key, draftId: parsed.data.draftId }] : [];
  },
  listMyTickets: (output, key) => {
    const parsed = listTicketsOutputSchema.safeParse(output);

    return parsed.success && parsed.data.tickets.length > 0
      ? [{ kind: "ticket-list", key, tickets: parsed.data.tickets }]
      : [];
  },
  offerChoices: (output, key) => {
    const parsed = offerChoicesOutputSchema.safeParse(output);

    return parsed.success
      ? [{ kind: "choices", key, options: parsed.data.options, answer: null }]
      : [];
  },
  getTicket: (output, key) => {
    const parsed = getTicketOutputSchema.safeParse(output);

    return parsed.success ? [{ kind: "ticket", key, ticket: parsed.data.ticket }] : [];
  },
};

export const authorKindOf = (message: UIMessage): MessageAuthorKind => {
  const metadata = metadataSchema.safeParse(message.metadata);

  return metadata.success ? metadata.data.authorKind : AUTHOR_KIND_BY_ROLE[message.role];
};

const analystOf = (message: UIMessage): ChatAnalystProps | null => {
  const metadata = metadataSchema.safeParse(message.metadata);

  return metadata.success && metadata.data.authorName
    ? { name: metadata.data.authorName, level: metadata.data.authorLevel ?? null }
    : null;
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

const attachmentOf = (part: ToolPart): ChatAttachmentProps[] => {
  const parse = ATTACHMENT_PARSERS[getToolName(part)];

  return parse !== undefined && part.state === "output-available"
    ? parse(part.output, part.toolCallId)
    : [];
};

export const actionsOf = (message: UIMessage): ChatActionProps[] =>
  message.parts.flatMap((part) => (isToolUIPart(part) ? actionOf(part) : []));

export const attachmentsOf = (message: UIMessage): ChatAttachmentProps[] =>
  message.parts.flatMap((part) => (isToolUIPart(part) ? attachmentOf(part) : []));

export const toChatLine = (message: UIMessage): ChatLineProps => ({
  id: message.id,
  authorKind: authorKindOf(message),
  analyst: analystOf(message),
  text: messageTextOf(message),
  actions: actionsOf(message),
  attachments: attachmentsOf(message),
});

const answerAfter = (lines: readonly ChatLineProps[], index: number): string | null =>
  lines.slice(index + 1).find((line) => line.authorKind === "employee")?.text ?? null;

export const withChoiceAnswers = (lines: readonly ChatLineProps[]): ChatLineProps[] =>
  lines.map((line, index) => {
    if (!line.attachments.some((attachment) => attachment.kind === "choices")) {
      return line;
    }

    const answer = answerAfter(lines, index);

    return {
      ...line,
      attachments: line.attachments.map((attachment) =>
        attachment.kind === "choices" ? { ...attachment, answer } : attachment,
      ),
    };
  });

export const countEmployeeMessages = (messages: readonly UIMessage[]): number =>
  messages.filter((message) => message.role === "user").length;
