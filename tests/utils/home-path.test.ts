import { describe, expect, it } from "vitest";
import { homePathFor } from "../../src/utils/home-path";

describe("homePathFor", () => {
  it.each([
    { role: "employee", expected: "/" },
    { role: "analyst", expected: "/console" },
  ] as const)("sends $role to $expected", ({ role, expected }) => {
    expect(homePathFor(role)).toBe(expected);
  });
});
