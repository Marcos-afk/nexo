import { describe, expect, it } from "vitest";
import type { ConversationMode } from "../../src/domain/conversation";
import { type HandoffAction, nextConversationMode } from "../../src/domain/handoff";
import { computeContactDueAt, type HandoffUrgency } from "../../src/domain/sla";

interface TransitionCase {
  readonly mode: ConversationMode;
  readonly action: HandoffAction;
  readonly expected: ConversationMode | null;
}

const transitionCases: readonly TransitionCase[] = [
  { mode: "agent", action: "transfer", expected: "awaiting_analyst" },
  { mode: "agent", action: "assume", expected: null },
  { mode: "agent", action: "reply", expected: null },
  { mode: "awaiting_analyst", action: "assume", expected: "with_analyst" },
  { mode: "awaiting_analyst", action: "return", expected: "agent" },
  { mode: "awaiting_analyst", action: "reply", expected: null },
  { mode: "awaiting_analyst", action: "close", expected: null },
  { mode: "awaiting_analyst", action: "transfer", expected: null },
  { mode: "with_analyst", action: "reply", expected: "with_analyst" },
  { mode: "with_analyst", action: "return", expected: "agent" },
  { mode: "with_analyst", action: "close", expected: "closed" },
  { mode: "with_analyst", action: "assume", expected: null },
  { mode: "closed", action: "transfer", expected: null },
  { mode: "closed", action: "reply", expected: null },
];

interface ContactDueCase {
  readonly name: string;
  readonly urgency: HandoffUrgency;
  readonly transferredAt: string;
  readonly expected: string;
}

const contactDueCases: readonly ContactDueCase[] = [
  {
    name: "urgent counts 30 minutes straight",
    urgency: "urgent",
    transferredAt: "2026-10-28T10:00:00-03:00",
    expected: "2026-10-28T10:30:00-03:00",
  },
  {
    name: "urgent ignores office hours",
    urgency: "urgent",
    transferredAt: "2026-10-28T23:50:00-03:00",
    expected: "2026-10-29T00:20:00-03:00",
  },
  {
    name: "normal counts 2 business hours",
    urgency: "normal",
    transferredAt: "2026-10-28T10:00:00-03:00",
    expected: "2026-10-28T12:00:00-03:00",
  },
  {
    name: "normal rolls over to the next day",
    urgency: "normal",
    transferredAt: "2026-10-28T17:00:00-03:00",
    expected: "2026-10-29T09:00:00-03:00",
  },
  {
    name: "normal outside office hours starts at the next opening",
    urgency: "normal",
    transferredAt: "2026-10-30T19:00:00-03:00",
    expected: "2026-11-02T10:00:00-03:00",
  },
];

describe("conversation transitions", () => {
  it.each(transitionCases)("$action from $mode gives $expected", ({ mode, action, expected }) => {
    expect(nextConversationMode(mode, action)).toBe(expected);
  });
});

describe("first contact deadline (D-05)", () => {
  it.each(contactDueCases)("$name", ({ urgency, transferredAt, expected }) => {
    const due = computeContactDueAt(urgency, new Date(transferredAt));

    expect(due.toISOString()).toBe(new Date(expected).toISOString());
  });
});
