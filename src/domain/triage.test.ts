import { describe, expect, it } from "vitest";
import { triageIntents, triageSchema } from "./triage";

const validTriage = {
  intent: "how_to",
  understood: "O funcionário quer resolver um problema no Outlook.",
  confidence: 90,
  rationale: "A mensagem descreve um problema técnico específico.",
  signals: ["missing_details"],
};

describe("triageSchema", () => {
  it("accepts a valid triage result", () => {
    expect(triageSchema.safeParse(validTriage).success).toBe(true);
  });

  it.each(triageIntents)("accepts the intent %s", (intent) => {
    expect(triageSchema.safeParse({ ...validTriage, intent }).success).toBe(true);
  });

  it.each([
    { name: "unknown intent", patch: { intent: "billing" } },
    { name: "confidence below the range", patch: { confidence: -1 } },
    { name: "confidence above the range", patch: { confidence: 101 } },
    { name: "non-integer confidence", patch: { confidence: 70.5 } },
    { name: "unknown signal", patch: { signals: ["angry"] } },
    { name: "empty understood", patch: { understood: "" } },
  ])("rejects $name", ({ patch }) => {
    expect(triageSchema.safeParse({ ...validTriage, ...patch }).success).toBe(false);
  });
});
