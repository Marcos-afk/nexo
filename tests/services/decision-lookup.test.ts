import { describe, expect, it } from "vitest";
import { DecisionNotFoundError } from "../../src/domain/errors";
import { createDecisionService } from "../../src/services/decisions/decision-service";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const setup = async () =>
  createDecisionService({
    database: await createSeededDatabase(),
    ids: createSequentialIds("dec"),
  });

describe("getForMessage", () => {
  it("returns the decision of a reply to its owner", async () => {
    const service = await setup();
    const decision = await service.getForMessage("emp-ana", "m-c-ana-handoff-3");

    expect(decision).toMatchObject({ id: "dec-ana-handoff", action: "transfer" });
  });

  it.each([
    ["another employee", "emp-bruno", "m-c-ana-handoff-3"],
    ["a message without decision", "emp-ana", "m-c-ana-handoff-1"],
    ["an unknown message", "emp-ana", "m-inexistente"],
  ])("refuses %s", async (_label, ownerId, messageId) => {
    const service = await setup();

    await expect(service.getForMessage(ownerId, messageId)).rejects.toBeInstanceOf(
      DecisionNotFoundError,
    );
  });
});
