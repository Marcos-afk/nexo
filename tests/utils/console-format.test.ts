import { describe, expect, it } from "vitest";
import type { ConsoleLabelProps } from "../../src/models/console";
import { avatarToneOf, dateTimeOf, labelViewOf, timeLabelOf } from "../../src/utils/console-format";

const NOW = new Date("2026-10-28T13:00:00Z");

describe("labelViewOf", () => {
  it.each([
    [
      "a transfer with a ticket",
      { kind: "transferred", ticketNumber: "INC-20311", contactDueAt: null },
      { text: "Transferida · INC-20311", tone: "warning" },
    ],
    [
      "a transfer counting down",
      { kind: "transferred", ticketNumber: null, contactDueAt: "2026-10-28T13:25:00Z" },
      { text: "Transferida · contato em 25 min", tone: "warning" },
    ],
    [
      "a transfer past its contact date",
      { kind: "transferred", ticketNumber: null, contactDueAt: "2026-10-28T12:50:00Z" },
      { text: "Transferida · contato vencido", tone: "warning" },
    ],
    [
      "a transfer with nothing else to say",
      { kind: "transferred", ticketNumber: null, contactDueAt: null },
      { text: "Transferida", tone: "warning" },
    ],
    [
      "a request for help by low confidence",
      { kind: "agent_asked_help", confidence: 41, decisionMessageId: "m-1" },
      { text: "Agent pediu ajuda · confiança 41%", tone: "danger" },
    ],
    ["the agent answering", { kind: "agent_active" }, { text: "Agent atendendo", tone: "neutral" }],
    [
      "a conversation solved by the agent",
      { kind: "resolved_by_agent" },
      { text: "Resolvida pelo agent", tone: "success" },
    ],
    ["a closed conversation", { kind: "closed" }, { text: "Encerrada", tone: "neutral" }],
    ["my conversation", { kind: "mine" }, { text: "Você está atendendo", tone: "info" }],
    [
      "someone else's conversation",
      { kind: "with_other", analystName: "Lia Torres" },
      { text: "Com Lia Torres", tone: "violet" },
    ],
  ] as const satisfies readonly (readonly [string, ConsoleLabelProps, unknown])[])(
    "describes %s",
    (_name, label, expected) => {
      expect(labelViewOf(label, NOW)).toEqual(expected);
    },
  );

  it("does not invent a countdown before the clock is known", () => {
    const label = {
      kind: "transferred",
      ticketNumber: null,
      contactDueAt: "2026-10-28T13:25:00Z",
    } as const;

    expect(labelViewOf(label, null).text).toBe("Transferida");
  });
});

describe("timeLabelOf", () => {
  it.each([
    ["a message from seconds ago", "2026-10-28T12:59:40Z", "agora"],
    ["a message from today", "2026-10-28T13:00:00Z".replace("13", "12"), "09:00"],
    ["a message from yesterday", "2026-10-27T15:00:00Z", "ontem"],
    ["an older message", "2026-10-20T15:00:00Z", "20/10"],
  ])("labels %s", (_name, iso, expected) => {
    expect(timeLabelOf(iso, NOW)).toBe(expected);
  });
});

describe("avatarToneOf", () => {
  it("always gives the same tone to the same person", () => {
    expect(avatarToneOf("emp-ana")).toEqual(avatarToneOf("emp-ana"));
  });
});

describe("dateTimeOf", () => {
  it("writes the day and the time of the office", () => {
    expect(dateTimeOf("2026-10-23T12:43:00Z")).toBe("23/10 às 09:43");
  });
});
