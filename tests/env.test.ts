import { describe, expect, it } from "vitest";
import { InvalidEnvironmentError } from "../src/domain/errors";
import { parseEnv } from "../src/env";

describe("parseEnv", () => {
  it("applies the defaults when nothing is set", () => {
    expect(parseEnv({})).toEqual({ NODE_ENV: "development", LEGACY_OUTAGE_SECONDS: 0 });
  });

  it.each([
    {
      name: "a production run",
      source: { NODE_ENV: "production" },
      key: "NODE_ENV",
      value: "production",
    },
    {
      name: "a simulated outage",
      source: { LEGACY_OUTAGE_SECONDS: "45" },
      key: "LEGACY_OUTAGE_SECONDS",
      value: 45,
    },
    {
      name: "an empty outage value",
      source: { LEGACY_OUTAGE_SECONDS: "" },
      key: "LEGACY_OUTAGE_SECONDS",
      value: 0,
    },
    {
      name: "the model key",
      source: { GOOGLE_GENERATIVE_AI_API_KEY: "fake-key" },
      key: "GOOGLE_GENERATIVE_AI_API_KEY",
      value: "fake-key",
    },
  ])("reads $name", ({ source, key, value }) => {
    expect(parseEnv(source)).toHaveProperty(key, value);
  });

  it.each([
    { name: "an unknown environment", source: { NODE_ENV: "staging" }, variable: "NODE_ENV" },
    {
      name: "a negative outage",
      source: { LEGACY_OUTAGE_SECONDS: "-1" },
      variable: "LEGACY_OUTAGE_SECONDS",
    },
    {
      name: "a non-numeric outage",
      source: { LEGACY_OUTAGE_SECONDS: "abc" },
      variable: "LEGACY_OUTAGE_SECONDS",
    },
    {
      name: "an empty model key",
      source: { GOOGLE_GENERATIVE_AI_API_KEY: "" },
      variable: "GOOGLE_GENERATIVE_AI_API_KEY",
    },
  ])("rejects $name and names only the variable", ({ source, variable }) => {
    const failure = (() => {
      try {
        return parseEnv(source);
      } catch (error) {
        return error;
      }
    })();

    expect(failure).toBeInstanceOf(InvalidEnvironmentError);
    expect(failure).toMatchObject({ variables: [variable] });
    expect((failure as Error).message).toBe(
      `Variáveis de ambiente ausentes ou inválidas: ${variable}.`,
    );
  });
});
