import { describe, expect, it } from "vitest";
import { handoffResponseSchema, offerChoicesOutputSchema } from "../../src/schemas/chat";

describe("offerChoicesOutputSchema", () => {
  it.each([
    { name: "two options", payload: { options: ["Sim", "Não"] }, valid: true },
    { name: "four options", payload: { options: ["a", "b", "c", "d"] }, valid: true },
    { name: "a single option", payload: { options: ["Sim"] }, valid: false },
    { name: "an empty option", payload: { options: ["Sim", ""] }, valid: false },
    { name: "a failure payload", payload: { error: "x" }, valid: false },
  ])("$name", ({ payload, valid }) => {
    expect(offerChoicesOutputSchema.safeParse(payload).success).toBe(valid);
  });
});

describe("handoffResponseSchema", () => {
  it.each([
    { name: "awaiting analyst", payload: { mode: "awaiting_analyst" }, valid: true },
    { name: "with analyst", payload: { mode: "with_analyst" }, valid: true },
    { name: "unknown mode", payload: { mode: "paused" }, valid: false },
    { name: "missing mode", payload: {}, valid: false },
  ])("$name", ({ payload, valid }) => {
    expect(handoffResponseSchema.safeParse(payload).success).toBe(valid);
  });
});
