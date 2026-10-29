import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "../../src/utils/relative-time";

const NOW = new Date("2026-10-29T16:00:00.000Z");
const minutesAgo = (minutes: number): Date => new Date(NOW.getTime() - minutes * 60_000);

describe("formatRelativeTime", () => {
  it.each([
    { name: "same moment", minutes: 0, expected: "agora" },
    { name: "under a minute", minutes: 0.5, expected: "agora" },
    { name: "a minute", minutes: 1, expected: "há 1 min" },
    { name: "59 minutes", minutes: 59, expected: "há 59 min" },
    { name: "one hour", minutes: 60, expected: "há 1 h" },
    { name: "23 hours", minutes: 23 * 60, expected: "há 23 h" },
    { name: "one day", minutes: 24 * 60, expected: "há 1 dia" },
    { name: "five days", minutes: 5 * 24 * 60 + 90, expected: "há 5 dias" },
    { name: "in the future", minutes: -10, expected: "agora" },
  ])("$name", ({ minutes, expected }) => {
    expect(formatRelativeTime(minutesAgo(minutes), NOW)).toBe(expected);
  });
});
