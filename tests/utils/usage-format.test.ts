import { describe, expect, it } from "vitest";
import { summarizeUsage } from "../../src/domain/usage";
import { secondsOf, usageLabelOf } from "../../src/utils/usage-format";

const MODEL = "google/gemini-3.5-flash-lite";

describe("secondsOf", () => {
  it.each([
    { ms: 0, expected: "0,0 s" },
    { ms: 950, expected: "1,0 s" },
    { ms: 9200, expected: "9,2 s" },
    { ms: 61_000, expected: "61,0 s" },
  ])("$ms ms -> $expected", ({ ms, expected }) => {
    expect(secondsOf(ms)).toBe(expected);
  });
});

describe("usageLabelOf", () => {
  it("is null when the agent never answered", () => {
    expect(usageLabelOf(summarizeUsage([]))).toBeNull();
  });

  it("describes one answer with tokens and latency", () => {
    const label = usageLabelOf(
      summarizeUsage([{ tokensIn: 3800, tokensOut: 320, latencyMs: 9200, model: MODEL }]),
    );

    expect(label).toBe(
      "1 resposta do agent · 4.120 tokens (3.800 entrada · 320 saída) · latência média 9,2 s (máx. 9,2 s)",
    );
  });

  it("uses the plural and omits the latency when it was not measured", () => {
    const label = usageLabelOf(
      summarizeUsage([
        { tokensIn: 100, tokensOut: 10, latencyMs: null, model: MODEL },
        { tokensIn: 100, tokensOut: 10, latencyMs: null, model: MODEL },
      ]),
    );

    expect(label).toBe("2 respostas do agent · 220 tokens (200 entrada · 20 saída)");
  });
});
