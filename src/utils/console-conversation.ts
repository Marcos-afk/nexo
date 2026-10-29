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

export const buildCaseSummary = (conversation: ConsoleConversationProps): string =>
  [
    `Caso de ${conversation.employee.name} (${conversation.employee.department})`,
    conversation.ticket
      ? `Chamado: ${conversation.ticket.number} · ${conversation.ticket.title}`
      : null,
    conversation.handoffLevel ? `Transferido para: Suporte ${conversation.handoffLevel}` : null,
    conversation.handoffReason ? `Motivo: ${conversation.handoffReason}` : null,
    conversation.handoffSummary,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

export interface TextSegmentProps {
  readonly start: number;
  readonly text: string;
  readonly isMatch: boolean;
}

const foldChar = (char: string): string =>
  char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const foldText = (value: string): string => [...value].map(foldChar).join("");

const NO_MATCH_SEGMENTS = (text: string): TextSegmentProps[] => [
  { start: 0, text, isMatch: false },
];

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[]\]/g, "$&");

export const splitByQuery = (text: string, query: string): TextSegmentProps[] => {
  const needle = foldText(query.trim());
  const chars = [...text];
  const folded = chars.map(foldChar);

  if (needle === "" || folded.some((char) => char.length !== 1)) {
    return NO_MATCH_SEGMENTS(text);
  }

  const matches = [...folded.join("").matchAll(new RegExp(escapeRegExp(needle), "g"))];
  const bounds = [
    0,
    ...matches.flatMap((match) => [match.index, match.index + needle.length]),
    chars.length,
  ];

  return bounds
    .slice(0, -1)
    .map((from, position) => ({
      start: from,
      text: chars.slice(from, bounds[position + 1]).join(""),
      isMatch: position % 2 === 1,
    }))
    .filter((segment) => segment.text !== "");
};

export const matchingMessageIds = (
  messages: readonly ConsoleMessageProps[],
  query: string,
): string[] => {
  const needle = foldText(query.trim());

  return needle === ""
    ? []
    : messages
        .filter(
          (message) =>
            message.authorKind !== "system" && foldText(message.content).includes(needle),
        )
        .map((message) => message.id);
};
