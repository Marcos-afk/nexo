import { describe, expect, it } from "vitest";
import {
  EMPTY_EMAIL_MESSAGE,
  EMPTY_PASSWORD_MESSAGE,
  INVALID_EMAIL_MESSAGE,
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

  it("trims the e-mail in the parsed output", () => {
    expect(
      loginSchema.parse({ email: " ana@nexo.test ", password: "x", remember: true }).email,
    ).toBe("ana@nexo.test");
  });
});
