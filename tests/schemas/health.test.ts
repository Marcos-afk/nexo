import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "../../src/schemas/health";

describe("healthResponseSchema", () => {
  it.each([
    { name: "online", payload: { health: { status: "online" } }, valid: true },
    { name: "degraded", payload: { health: { status: "degraded" } }, valid: true },
    { name: "offline", payload: { health: { status: "offline" } }, valid: true },
    {
      name: "ignores the other report fields",
      payload: { health: { status: "online", model: "ok", tickets: "ok", checkedAt: "x" } },
      valid: true,
    },
    { name: "unknown status", payload: { health: { status: "sleeping" } }, valid: false },
    { name: "missing health", payload: {}, valid: false },
  ])("$name", ({ payload, valid }) => {
    expect(healthResponseSchema.safeParse(payload).success).toBe(valid);
  });
});
