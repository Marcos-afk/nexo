import { describe, expect, it } from "vitest";
import { getUserAcronym } from "../../src/utils/get-user-acronym";

describe("getUserAcronym", () => {
  it.each([
    { name: "two words", input: "Ana Souza", expected: "AS" },
    { name: "keeps only the first two words", input: "Maria da Silva Santos", expected: "MD" },
    { name: "single word", input: "Rafael", expected: "R" },
    { name: "lowercase input", input: "carla dias", expected: "CD" },
    { name: "extra spaces", input: "  Ana   Souza  ", expected: "AS" },
    { name: "empty", input: "", expected: "" },
  ])("$name", ({ input, expected }) => {
    expect(getUserAcronym(input)).toBe(expected);
  });
});
