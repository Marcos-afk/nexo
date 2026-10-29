import { describe, expect, it } from "vitest";
import { passwordAgeLabelOf } from "../../src/utils/password-age";

const NOW = new Date("2026-10-29T12:00:00-03:00");

describe("passwordAgeLabelOf", () => {
  it.each([
    {
      name: "42 days ago, like the prototype",
      changedAt: "2026-09-17T09:00:00-03:00",
      expected: "Alterada há 42 dias",
    },
    { name: "one day ago", changedAt: "2026-10-28T09:00:00-03:00", expected: "Alterada há 1 dia" },
    {
      name: "just under two days",
      changedAt: "2026-10-27T13:00:00-03:00",
      expected: "Alterada há 1 dia",
    },
    { name: "earlier today", changedAt: "2026-10-29T08:00:00-03:00", expected: "Alterada hoje" },
    {
      name: "a few seconds ago",
      changedAt: "2026-10-29T11:59:50-03:00",
      expected: "Alterada hoje",
    },
    {
      name: "a date in the future",
      changedAt: "2026-11-05T09:00:00-03:00",
      expected: "Alterada hoje",
    },
    {
      name: "over a year ago",
      changedAt: "2025-01-01T09:00:00-03:00",
      expected: "Alterada há 666 dias",
    },
  ])("$name", ({ changedAt, expected }) => {
    expect(passwordAgeLabelOf(new Date(changedAt), NOW)).toBe(expected);
  });

  it("says there is no record when the date was never stored", () => {
    expect(passwordAgeLabelOf(null, NOW)).toBe("Sem registro de alteração da senha");
  });
});
