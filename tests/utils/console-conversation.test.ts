import { describe, expect, it } from "vitest";
import type { ConsoleConversationProps, ConsoleMessageProps } from "../../src/models/console";
import {
  authorLabelOf,
  dueLabelOf,
  isAssignedToOther,
  isAssignedToViewer,
  lastEmployeeMessageIdOf,
  modeBadgeOf,
  needsCloseConfirmation,
  toEntries,
} from "../../src/utils/console-conversation";

const NOW = new Date("2026-10-29T15:00:00Z");

const conversation = (overrides: Partial<ConsoleConversationProps>): ConsoleConversationProps => ({
  id: "c-1",
  viewerId: "analyst-rafael",
  employee: { id: "emp-ana", name: "Ana Souza", department: "Financeiro" },
  mode: "awaiting_analyst",
  handoffLevel: "N1",
  contactDueAt: null,
  ticket: null,
  assignedAnalyst: null,
  messages: [],
  ...overrides,
});

const message = (overrides: Partial<ConsoleMessageProps>): ConsoleMessageProps => ({
  id: "m-1",
  authorKind: "employee",
  authorName: null,
  authorLevel: null,
  content: "Oi",
  createdAt: "2026-10-29T14:00:00Z",
  readByEmployee: null,
  ...overrides,
});

const MINE = { id: "analyst-rafael", name: "Rafael Lima", level: "N2" } as const;
const OTHER = { id: "analyst-lia", name: "Lia Torres", level: "N1" } as const;

describe("modeBadgeOf", () => {
  it.each([
    ["waiting", conversation({}), "Aguardando atendente", "warning"],
    ["with the agent", conversation({ mode: "agent" }), "Agent atendendo", "neutral"],
    ["closed", conversation({ mode: "closed" }), "Encerrada", "neutral"],
    [
      "mine",
      conversation({ mode: "with_analyst", assignedAnalyst: MINE }),
      "Em atendimento (você)",
      "info",
    ],
    [
      "someone else's",
      conversation({ mode: "with_analyst", assignedAnalyst: OTHER }),
      "Em atendimento (Lia Torres)",
      "info",
    ],
  ] as const)("describes a conversation that is %s", (_name, input, text, tone) => {
    expect(modeBadgeOf(input)).toEqual({ text, tone });
  });
});

describe("assignment", () => {
  it.each([
    ["mine", conversation({ mode: "with_analyst", assignedAnalyst: MINE }), true, false],
    ["someone else's", conversation({ mode: "with_analyst", assignedAnalyst: OTHER }), false, true],
    ["waiting", conversation({}), false, false],
  ] as const)("reads a conversation that is %s", (_name, input, mine, other) => {
    expect(isAssignedToViewer(input)).toBe(mine);
    expect(isAssignedToOther(input)).toBe(other);
  });
});

describe("needsCloseConfirmation", () => {
  it.each([
    ["no ticket", null, false],
    ["an open ticket", { number: "INC-1", title: "x", status: "in_progress" }, true],
    ["a resolved ticket", { number: "INC-1", title: "x", status: "resolved" }, false],
  ] as const)("is decided by %s", (_name, ticket, expected) => {
    expect(needsCloseConfirmation(conversation({ ticket }))).toBe(expected);
  });
});

describe("message helpers", () => {
  it("finds the last employee message", () => {
    const messages = [
      message({ id: "m-1" }),
      message({ id: "m-2", authorKind: "agent" }),
      message({ id: "m-3" }),
      message({ id: "m-4", authorKind: "system" }),
    ];

    expect(lastEmployeeMessageIdOf(messages)).toBe("m-3");
    expect(lastEmployeeMessageIdOf([])).toBeNull();
  });

  it.each([
    ["the employee", message({}), "Ana Souza"],
    ["the agent", message({ authorKind: "agent" }), "Nexo Assist"],
    ["an analyst", message({ authorKind: "analyst", authorName: "Rafael Lima" }), "Rafael Lima"],
  ] as const)("names %s", (_name, input, expected) => {
    expect(authorLabelOf(input, "Ana Souza")).toBe(expected);
  });

  it("writes the contact deadline as a time of the day", () => {
    expect(dueLabelOf("2026-10-29T15:05:00Z")).toBe("até 12:05");
    expect(dueLabelOf(null)).toBeNull();
  });
});

describe("toEntries", () => {
  const messages = [
    message({ id: "m-1", createdAt: "2026-10-28T14:00:00Z" }),
    message({ id: "m-2", createdAt: "2026-10-28T14:05:00Z" }),
    message({ id: "m-3", createdAt: "2026-10-29T14:00:00Z" }),
  ];

  it("starts each day with a separator", () => {
    expect(toEntries(messages, NOW).map((entry) => entry.kind)).toEqual([
      "day",
      "message",
      "message",
      "day",
      "message",
    ]);
    expect(toEntries(messages, NOW).filter((entry) => entry.kind === "day")).toMatchObject([
      { label: "Ontem" },
      { label: "Hoje" },
    ]);
  });

  it("lists only the messages while the clock is not known", () => {
    expect(toEntries(messages, null).map((entry) => entry.kind)).toEqual([
      "message",
      "message",
      "message",
    ]);
  });
});
