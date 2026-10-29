import { describe, expect, it } from "vitest";
import { draftCodeOf } from "../../src/utils/draft-code";

describe("draftCodeOf", () => {
  it.each([
    { name: "keeps a code that already looks like one", id: "D-381", expected: "D-381" },
    {
      name: "shortens a generated id",
      id: "3f2a91c0-7d4e-4c1b-9a55-0e1f2b3c4d5e",
      expected: "D-3F2A",
    },
    { name: "handles a very short id", id: "ab", expected: "D-AB" },
  ])("$name", ({ id, expected }) => {
    expect(draftCodeOf(id)).toBe(expected);
  });
});
