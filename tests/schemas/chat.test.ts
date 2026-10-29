import { describe, expect, it } from "vitest";
import {
  chatSessionResponseSchema,
  handoffResponseSchema,
  offerChoicesOutputSchema,
} from "../../src/schemas/chat";

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

describe("chatSessionResponseSchema", () => {
  const session = { mode: "agent", employeeMessageCount: 4, messageLimit: 30 };

  it.each([
    { name: "a session in agent mode", payload: { session }, valid: true },
    {
      name: "a session with the analyst",
      payload: { session: { ...session, mode: "with_analyst" } },
      valid: true,
    },
    { name: "an unknown mode", payload: { session: { ...session, mode: "paused" } }, valid: false },
    {
      name: "a negative count",
      payload: { session: { ...session, employeeMessageCount: -1 } },
      valid: false,
    },
    { name: "a zero limit", payload: { session: { ...session, messageLimit: 0 } }, valid: false },
    { name: "a missing session", payload: {}, valid: false },
  ])("$name", ({ payload, valid }) => {
    expect(chatSessionResponseSchema.safeParse(payload).success).toBe(valid);
  });
});
