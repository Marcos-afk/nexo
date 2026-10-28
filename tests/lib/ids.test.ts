import { describe, expect, it } from "vitest";
import { uuidGenerator } from "@/lib/ids";

describe("uuidGenerator", () => {
  it("returns distinct UUIDs", () => {
    const ids = new Set([uuidGenerator.next(), uuidGenerator.next(), uuidGenerator.next()]);

    expect(ids.size).toBe(3);
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }
  });
});
