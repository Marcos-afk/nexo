import { describe, expect, it } from "vitest";
import { conversationModes } from "../../src/domain/conversation";
import { type Triage, type TriageIntent, triageIntents } from "../../src/domain/triage";
import {
  actionLabelOf,
  CONFIDENCE_HANDOFF_THRESHOLD,
  decideTurn,
  type PolicyFacts,
  shouldInvokeAgent,
  type TurnDecision,
} from "../../src/domain/turn-policy";

const buildTriage = (patch: Partial<Triage> = {}): Triage => ({
  intent: "how_to",
  understood: "O funcionário quer ajuda com a VPN.",
  confidence: 90,
  rationale: "Mensagem clara.",
  signals: [],
  ...patch,
});

const buildFacts = (patch: Partial<PolicyFacts> = {}): PolicyFacts => ({
  mode: "agent",
  triage: buildTriage(),
  hasOverdueTicket: false,
  ...patch,
});

describe("shouldInvokeAgent", () => {
  it.each(conversationModes)("returns %s only for the agent mode", (mode) => {
    expect(shouldInvokeAgent(mode)).toBe(mode === "agent");
  });
});

describe("decideTurn: conversation mode", () => {
  it.each(conversationModes.filter((mode) => mode !== "agent"))(
    "skips the agent when the mode is %s",
    (mode) => {
      expect(decideTurn(buildFacts({ mode, triage: buildTriage({ confidence: 10 }) }))).toEqual({
        kind: "skip_agent",
      });
    },
  );
});

interface DecisionCase {
  readonly name: string;
  readonly facts: PolicyFacts;
  readonly expected: TurnDecision;
}

const decisionCases: readonly DecisionCase[] = [
  {
    name: "hands off when the employee asks for an analyst by intent",
    facts: buildFacts({ triage: buildTriage({ intent: "human_request" }) }),
    expected: { kind: "handoff", reason: "employee_request" },
  },
  {
    name: "hands off when the employee asks for an analyst by signal",
    facts: buildFacts({ triage: buildTriage({ signals: ["asks_for_human"] }) }),
    expected: { kind: "handoff", reason: "employee_request" },
  },
  {
    name: "prefers the employee request over a critical incident",
    facts: buildFacts({
      triage: buildTriage({ intent: "human_request", signals: ["critical_impact"] }),
    }),
    expected: { kind: "handoff", reason: "employee_request" },
  },
  {
    name: "hands off on a critical incident",
    facts: buildFacts({ triage: buildTriage({ signals: ["critical_impact"] }) }),
    expected: { kind: "handoff", reason: "critical_incident" },
  },
  {
    name: "redirects an out-of-scope subject",
    facts: buildFacts({ triage: buildTriage({ intent: "out_of_scope" }) }),
    expected: { kind: "redirect_out_of_scope" },
  },
  {
    name: "redirects an out-of-scope subject even with low confidence",
    facts: buildFacts({ triage: buildTriage({ intent: "out_of_scope", confidence: 30 }) }),
    expected: { kind: "redirect_out_of_scope" },
  },
  {
    name: "hands off below the confidence threshold",
    facts: buildFacts({ triage: buildTriage({ confidence: CONFIDENCE_HANDOFF_THRESHOLD - 1 }) }),
    expected: { kind: "handoff", reason: "low_confidence" },
  },
  {
    name: "answers exactly at the confidence threshold",
    facts: buildFacts({ triage: buildTriage({ confidence: CONFIDENCE_HANDOFF_THRESHOLD }) }),
    expected: {
      kind: "answer",
      tools: ["searchHelpArticles", "findSimilarTickets"],
      offerAnalyst: false,
    },
  },
  {
    name: "offers an analyst when a ticket is overdue",
    facts: buildFacts({
      triage: buildTriage({ intent: "ticket_lookup" }),
      hasOverdueTicket: true,
    }),
    expected: { kind: "answer", tools: ["listMyTickets", "getTicket"], offerAnalyst: true },
  },
];

describe("decideTurn: policy order", () => {
  it.each(decisionCases)("$name", ({ facts, expected }) => {
    expect(decideTurn(facts)).toEqual(expected);
  });
});

const toolsByAnsweredIntent: Readonly<Record<TriageIntent, readonly string[] | null>> = {
  how_to: ["searchHelpArticles", "findSimilarTickets"],
  ticket_lookup: ["listMyTickets", "getTicket"],
  ticket_create: ["searchHelpArticles", "findSimilarTickets", "buildDraft"],
  human_request: null,
  out_of_scope: null,
  chitchat: [],
  unclear: [],
};

describe("decideTurn: tools by intent", () => {
  it.each(triageIntents)("exposes the expected tools for %s", (intent) => {
    const decision = decideTurn(buildFacts({ triage: buildTriage({ intent }) }));
    const expectedTools = toolsByAnsweredIntent[intent];

    if (expectedTools === null) {
      expect(decision.kind).not.toBe("answer");
      return;
    }

    expect(decision).toEqual({ kind: "answer", tools: expectedTools, offerAnalyst: false });
  });
});

describe("actionLabelOf", () => {
  it.each([
    { decision: { kind: "skip_agent" }, expected: "skip_agent" },
    { decision: { kind: "redirect_out_of_scope" }, expected: "redirect_out_of_scope" },
    { decision: { kind: "handoff", reason: "low_confidence" }, expected: "handoff:low_confidence" },
    {
      decision: { kind: "handoff", reason: "critical_incident" },
      expected: "handoff:critical_incident",
    },
    { decision: { kind: "answer", tools: [], offerAnalyst: false }, expected: "answer" },
  ] as const)("labels $expected", ({ decision, expected }) => {
    expect(actionLabelOf(decision)).toBe(expected);
  });
});
