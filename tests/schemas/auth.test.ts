import { describe, expect, it } from "vitest";
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH } from "../../src/domain/input-limits";
import {
  EMPTY_EMAIL_MESSAGE,
  EMPTY_PASSWORD_MESSAGE,
  forgotPasswordResponseSchema,
  forgotPasswordSchema,
  INVALID_EMAIL_MESSAGE,
  LONG_EMAIL_MESSAGE,
  LONG_PASSWORD_MESSAGE,
  loginSchema,
} from "../../src/schemas/auth";

const messagesOf = (values: unknown): Record<string, string> => {
  const result = loginSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      );
};

describe("loginSchema", () => {
  it.each([
    { name: "empty", email: "", expected: EMPTY_EMAIL_MESSAGE },
    { name: "only spaces", email: "   ", expected: EMPTY_EMAIL_MESSAGE },
    { name: "without at sign", email: "ana.nexo.com", expected: INVALID_EMAIL_MESSAGE },
    { name: "without domain dot", email: "ana@nexo", expected: INVALID_EMAIL_MESSAGE },
    { name: "valid", email: "ana@nexo.test", expected: undefined },
    { name: "valid with surrounding spaces", email: " ana@nexo.test ", expected: undefined },
  ])("e-mail $name", ({ email, expected }) => {
    expect(messagesOf({ email, password: "x", remember: true }).email).toBe(expected);
  });

  it.each([
    {
      name: "both empty",
      values: { email: "", password: "", remember: true },
      expected: { email: EMPTY_EMAIL_MESSAGE, password: EMPTY_PASSWORD_MESSAGE },
    },
    {
      name: "only password empty",
      values: { email: "ana@nexo.test", password: "", remember: false },
      expected: { password: EMPTY_PASSWORD_MESSAGE },
    },
    {
      name: "valid",
      values: { email: "ana@nexo.test", password: "qualquer", remember: false },
      expected: {},
    },
  ])("$name", ({ values, expected }) => {
    expect(messagesOf(values)).toEqual(expected);
  });

  it.each([
    {
      name: "an e-mail over the limit",
      values: { email: `${"a".repeat(MAX_EMAIL_LENGTH)}@nexo.test`, password: "x", remember: true },
      expected: { email: LONG_EMAIL_MESSAGE },
    },
    {
      name: "a password over the limit",
      values: {
        email: "ana@nexo.test",
        password: "x".repeat(MAX_PASSWORD_LENGTH + 1),
        remember: true,
      },
      expected: { password: LONG_PASSWORD_MESSAGE },
    },
    {
      name: "a password exactly at the limit",
      values: { email: "ana@nexo.test", password: "x".repeat(MAX_PASSWORD_LENGTH), remember: true },
      expected: {},
    },
  ])("limits $name", ({ values, expected }) => {
    expect(messagesOf(values)).toEqual(expected);
  });

  it("trims the e-mail in the parsed output", () => {
    expect(
      loginSchema.parse({ email: " ana@nexo.test ", password: "x", remember: true }).email,
    ).toBe("ana@nexo.test");
  });
});

describe("forgotPasswordSchema", () => {
  it.each([
    { name: "empty", email: "", expected: EMPTY_EMAIL_MESSAGE },
    { name: "only spaces", email: "   ", expected: EMPTY_EMAIL_MESSAGE },
    { name: "without at sign", email: "ana.nexo.com", expected: INVALID_EMAIL_MESSAGE },
    { name: "valid", email: "ana@nexo.test", expected: undefined },
    { name: "valid with surrounding spaces", email: " ana@nexo.test ", expected: undefined },
  ])("e-mail $name", ({ email, expected }) => {
    const result = forgotPasswordSchema.safeParse({ email });

    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(expected);
  });

  it("trims the e-mail in the parsed output", () => {
    expect(forgotPasswordSchema.parse({ email: " ana@nexo.test " })).toEqual({
      email: "ana@nexo.test",
    });
  });
});

describe("forgotPasswordResponseSchema", () => {
  it.each([
    { name: "a requested answer", payload: { requested: true }, valid: true },
    { name: "a false answer", payload: { requested: false }, valid: false },
    { name: "an empty answer", payload: {}, valid: false },
  ])("$name", ({ payload, valid }) => {
    expect(forgotPasswordResponseSchema.safeParse(payload).success).toBe(valid);
  });
});
