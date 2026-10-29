import { describe, expect, it } from "vitest";
import { type LabelFacts, labelOf, needsAttention } from "../../src/domain/console";

const DUE = new Date("2026-10-28T12:05:00-03:00");

const facts = (overrides: Partial<LabelFacts>): LabelFacts => ({
  mode: "agent",
  assignedAnalystId: null,
  assignedAnalystName: null,
  viewerId: "analyst-rafael",
  handoffReason: null,
  ticketNumber: null,
  contactDueAt: null,
  lastConfidence: null,
  ...overrides,
});

describe("labelOf", () => {
  it.each([
    ["the agent answering", facts({ mode: "agent" }), { kind: "agent_active" }],
    [
      "a transfer with ticket and due date",
      facts({ mode: "awaiting_analyst", ticketNumber: "INC-20311", contactDueAt: DUE }),
      { kind: "transferred", ticketNumber: "INC-20311", contactDueAt: DUE },
    ],
    [
      "a transfer that kept a confident decision",
      facts({ mode: "awaiting_analyst", lastConfidence: 95 }),
      { kind: "transferred", ticketNumber: null, contactDueAt: null },
    ],
    [
      "a transfer by low confidence",
      facts({ mode: "awaiting_analyst", lastConfidence: 41 }),
      { kind: "agent_asked_help", confidence: 41 },
    ],
    [
      "a conversation taken by the viewer",
      facts({ mode: "with_analyst", assignedAnalystId: "analyst-rafael" }),
      { kind: "mine" },
    ],
    [
      "a conversation taken by someone else",
      facts({
        mode: "with_analyst",
        assignedAnalystId: "analyst-lia",
        assignedAnalystName: "Lia Torres",
      }),
      { kind: "with_other", analystName: "Lia Torres" },
    ],
    [
      "a closed conversation that never reached an analyst",
      facts({ mode: "closed" }),
      { kind: "resolved_by_agent" },
    ],
    [
      "a closed conversation that was transferred",
      facts({ mode: "closed", handoffReason: "Pedido do funcionário" }),
      { kind: "closed" },
    ],
  ])("labels %s", (_name, input, expected) => {
    expect(labelOf(input)).toEqual(expected);
  });
});

describe("needsAttention", () => {
  const viewerId = "analyst-rafael";

  it.each([
    ["waiting for an analyst", "awaiting_analyst", null, 0, true],
    ["mine with a new message", "with_analyst", viewerId, 2, true],
    ["mine without new messages", "with_analyst", viewerId, 0, false],
    ["someone else's with a new message", "with_analyst", "analyst-lia", 3, false],
    ["with the agent", "agent", null, 4, false],
    ["closed", "closed", null, 1, false],
  ] as const)("is %s", (_name, mode, assignedAnalystId, unread, expected) => {
    expect(needsAttention({ mode, assignedAnalystId, viewerId, unread })).toBe(expected);
  });
});
