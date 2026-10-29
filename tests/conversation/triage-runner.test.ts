import { APICallError, type UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { runTriage } from "../../src/conversation/triage-runner";
import {
  ModelRateLimitedError,
  ModelUnavailableError,
  TriageOutputInvalidError,
} from "../../src/domain/errors";
import { createTriageAgent } from "../../src/mastra/agents/triage-agent";
import { createFixedClock } from "../support/clock";
import { createFailingModel, createMockObjectModel, type MockModel } from "../support/mock-model";

const history: UIMessage[] = [
  { id: "m-1", role: "user", parts: [{ type: "text", text: "Meu VPN caiu" }] },
];

const validTriage = {
  intent: "how_to",
  understood: "Problema de VPN.",
  confidence: 88,
  rationale: "Descrição clara.",
  signals: [],
};

const run = ({ model }: MockModel) =>
  runTriage(
    { agent: createTriageAgent(model), clock: createFixedClock("2026-10-28T10:00:00-03:00") },
    history,
  );

const apiErrorWith = (statusCode: number) =>
  new APICallError({
    message: "falha",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode,
  });

describe("runTriage", () => {
  it("returns the validated triage with tokens and the model name", async () => {
    const outcome = await run(
      createMockObjectModel(validTriage, { input: 30, output: 12 }, "gemini-3.5-flash-lite"),
    );

    expect(outcome.triage).toEqual(validTriage);
    expect(outcome).toMatchObject({
      tokensIn: 30,
      tokensOut: 12,
      model: "google/gemini-3.5-flash-lite",
    });
  });

  it("rejects an output that breaks the triage schema", async () => {
    const mock = createMockObjectModel({ ...validTriage, confidence: 250 });

    await expect(run(mock)).rejects.toBeInstanceOf(TriageOutputInvalidError);
  });

  it.each([
    { name: "a 429 into a rate-limit error", status: 429, expected: ModelRateLimitedError },
    { name: "a 503 into an unavailable error", status: 503, expected: ModelUnavailableError },
  ])("maps $name", async ({ status, expected }) => {
    await expect(run(createFailingModel(apiErrorWith(status)))).rejects.toBeInstanceOf(expected);
  });

  it("calls the model only once when it fails, so a failure does not spend more quota", async () => {
    const failing = createFailingModel(apiErrorWith(503));

    await expect(run(failing)).rejects.toBeInstanceOf(ModelUnavailableError);
    expect(failing.callCount()).toBe(1);
  });
});
