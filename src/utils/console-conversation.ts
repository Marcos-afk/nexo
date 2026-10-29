import {
  AGENT_AUTHOR_LABEL,
  EMPLOYEE_AUTHOR_FALLBACK,
  MODE_BADGE_LABELS,
  MODE_BADGE_TONES,
} from "@/constants/console";
import { isClosed } from "@/domain/ticket-rules";
import type {
  ConsoleConversationProps,
  ConsoleLabelViewProps,
  ConsoleMessageProps,
  ConversationEntryType,
} from "@/models/console";
import { clockTimeOf, dayKeyOfIso, dayLabelOf } from "@/utils/console-format";

export const isAssignedToViewer = (conversation: ConsoleConversationProps): boolean =>
  conversation.mode === "with_analyst" &&
  conversation.assignedAnalyst?.id === conversation.viewerId;

export const isAssignedToOther = (conversation: ConsoleConversationProps): boolean =>
  conversation.mode === "with_analyst" &&
  conversation.assignedAnalyst !== null &&
  conversation.assignedAnalyst.id !== conversation.viewerId;

export const needsCloseConfirmation = ({ ticket }: ConsoleConversationProps): boolean =>
  ticket !== null && !isClosed(ticket.status);

export const modeBadgeOf = (conversation: ConsoleConversationProps): ConsoleLabelViewProps => {
  const base = MODE_BADGE_LABELS[conversation.mode];
  const tone = MODE_BADGE_TONES[conversation.mode];

  if (conversation.mode !== "with_analyst" || conversation.assignedAnalyst === null) {
    return { text: base, tone };
  }

  const who = isAssignedToViewer(conversation) ? "você" : conversation.assignedAnalyst.name;

  return { text: `${base} (${who})`, tone };
};

export const lastEmployeeMessageIdOf = (messages: readonly ConsoleMessageProps[]): string | null =>
  messages.findLast((message) => message.authorKind === "employee")?.id ?? null;

export const dueLabelOf = (contactDueAt: string | null): string | null =>
  contactDueAt === null ? null : `até ${clockTimeOf(contactDueAt)}`;

export const authorLabelOf = (message: ConsoleMessageProps, employeeName: string): string => {
  if (message.authorKind === "agent") {
    return AGENT_AUTHOR_LABEL;
  }

  return message.authorKind === "analyst"
    ? (message.authorName ?? EMPLOYEE_AUTHOR_FALLBACK)
    : employeeName;
};

export const toEntries = (
  messages: readonly ConsoleMessageProps[],
  now: Date | null,
): ConversationEntryType[] =>
  messages.flatMap((message, index) => {
    const previous = messages[index - 1];
    const startsDay =
      !previous || dayKeyOfIso(previous.createdAt) !== dayKeyOfIso(message.createdAt);
    const entry: ConversationEntryType = { kind: "message", key: message.id, message };

    return startsDay && now !== null
      ? [
          {
            kind: "day" as const,
            key: `day-${dayKeyOfIso(message.createdAt)}`,
            label: dayLabelOf(message.createdAt, now),
          },
          entry,
        ]
      : [entry];
  });
