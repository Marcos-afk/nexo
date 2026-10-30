import { describe, expect, it } from "vitest";
import { shortDateOf } from "../../src/utils/short-date";

describe("shortDateOf", () => {
  it.each([
    { formatted: "16/10/2026 às 14:20", expected: "16 out" },
    { formatted: "01/01/2026 às 08:00", expected: "01 jan" },
    { formatted: "31/12/2026 às 18:00", expected: "31 dez" },
    { formatted: "09/05/2026", expected: "09 mai" },
    { formatted: "13/13/2026 às 10:00", expected: "13/13/2026 às 10:00" },
    { formatted: "ontem", expected: "ontem" },
    { formatted: "", expected: "" },
  ])("$formatted -> $expected", ({ formatted, expected }) => {
    expect(shortDateOf(formatted)).toBe(expected);
  });
});
