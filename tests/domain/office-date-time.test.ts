import { describe, expect, it } from "vitest";
import { formatOfficeDateTime, parseOfficeDateTime } from "../../src/domain/sla";

describe("parseOfficeDateTime", () => {
  it.each([
    { text: "29/10/2026 às 13:43", iso: "2026-10-29T16:43:00.000Z" },
    { text: "16/10/2026 às 14:20", iso: "2026-10-16T17:20:00.000Z" },
    { text: "01/01/2027 às 00:00", iso: "2027-01-01T03:00:00.000Z" },
    { text: "31/12/2026 às 23:59", iso: "2027-01-01T02:59:00.000Z" },
  ])("reads $text in the office time zone", ({ text, iso }) => {
    expect(parseOfficeDateTime(text)?.toISOString()).toBe(iso);
  });

  it.each([
    { name: "empty", text: "" },
    { name: "ISO date", text: "2026-10-29T16:43:00.000Z" },
    { name: "missing the connector", text: "29/10/2026 13:43" },
    { name: "free text", text: "amanhã cedo" },
  ])("returns null for $name", ({ text }) => {
    expect(parseOfficeDateTime(text)).toBeNull();
  });

  it("round-trips with formatOfficeDateTime", () => {
    const moment = new Date("2026-10-29T16:43:00.000Z");

    expect(parseOfficeDateTime(formatOfficeDateTime(moment))).toEqual(moment);
  });
});
