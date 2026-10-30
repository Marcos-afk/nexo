import { describe, expect, it } from "vitest";
import { summarizeUsage, type TurnUsage } from "../../src/domain/usage";

const turn = (overrides: Partial<TurnUsage> = {}): TurnUsage => ({
  tokensIn: 1000,
  tokensOut: 100,
  latencyMs: 4000,
  model: "google/gemini-3.5-flash-lite",
  ...overrides,
});

describe("summarizeUsage", () => {
  it("returns zeros and null latencies for no turns", () => {
    expect(summarizeUsage([])).toEqual({
      turns: 0,
      tokensIn: 0,
      tokensOut: 0,
      totalTokens: 0,
      averageLatencyMs: null,
      maxLatencyMs: null,
      models: [],
    });
  });

  it("sums tokens and averages the latency", () => {
    const summary = summarizeUsage([
      turn(),
      turn({ tokensIn: 2000, tokensOut: 300, latencyMs: 9000 }),
    ]);

    expect(summary).toMatchObject({
      turns: 2,
      tokensIn: 3000,
      tokensOut: 400,
      totalTokens: 3400,
      averageLatencyMs: 6500,
      maxLatencyMs: 9000,
    });
  });

  it.each([
    {
      name: "tokens missing in one turn",
      turns: [turn(), turn({ tokensIn: null, tokensOut: null })],
      totalTokens: 1100,
      averageLatencyMs: 4000,
    },
    {
      name: "latency missing in one turn",
      turns: [turn(), turn({ latencyMs: null })],
      totalTokens: 2200,
      averageLatencyMs: 4000,
    },
    {
      name: "everything missing",
      turns: [turn({ tokensIn: null, tokensOut: null, latencyMs: null })],
      totalTokens: 0,
      averageLatencyMs: null,
    },
  ])("ignores unmeasured values: $name", ({ turns, totalTokens, averageLatencyMs }) => {
    const summary = summarizeUsage(turns);

    expect(summary.totalTokens).toBe(totalTokens);
    expect(summary.averageLatencyMs).toBe(averageLatencyMs);
  });

  it("counts the turns by model, most used first", () => {
    const summary = summarizeUsage([
      turn({ model: "b" }),
      turn({ model: "a" }),
      turn({ model: "b" }),
    ]);

    expect(summary.models).toEqual([
      { model: "b", turns: 2 },
      { model: "a", turns: 1 },
    ]);
  });
});
