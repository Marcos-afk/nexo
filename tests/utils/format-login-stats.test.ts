import { describe, expect, it } from "vitest";
import { formatLoginStats, UNAVAILABLE_STATS_VIEW } from "../../src/utils/format-login-stats";

describe("formatLoginStats", () => {
  it.each([
    {
      name: "full stats",
      stats: { firstResponseSeconds: 8, resolvedWithoutQueuePercent: 72, analystsOnline: 6 },
      expected: { firstResponse: "8 s", withoutQueue: "72%", analystsOnline: "6" },
    },
    {
      name: "rounds fractional values",
      stats: { firstResponseSeconds: 7.6, resolvedWithoutQueuePercent: 71.5, analystsOnline: 0 },
      expected: { firstResponse: "8 s", withoutQueue: "72%", analystsOnline: "0" },
    },
    {
      name: "no data yet keeps the dash",
      stats: { firstResponseSeconds: null, resolvedWithoutQueuePercent: null, analystsOnline: 1 },
      expected: { firstResponse: "—", withoutQueue: "—", analystsOnline: "1" },
    },
    { name: "endpoint failure", stats: null, expected: UNAVAILABLE_STATS_VIEW },
  ])("$name", ({ stats, expected }) => {
    expect(formatLoginStats(stats)).toEqual(expected);
  });
});
