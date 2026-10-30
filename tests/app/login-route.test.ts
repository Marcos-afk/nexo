import { describe, expect, it } from "vitest";
import { POST } from "../../src/app/api/auth/login/route";
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH } from "../../src/domain/input-limits";

const HTTP_BAD_REQUEST = 400;

const postBody = (body: unknown): Request =>
  new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const longEmail = `${"a".repeat(MAX_EMAIL_LENGTH)}@nexo.test`;

describe("POST /api/auth/login input limits", () => {
  it.each([
    { name: "an e-mail over the limit", body: { email: longEmail, password: "x" } },
    {
      name: "a password over the limit",
      body: { email: "ana@nexo.test", password: "x".repeat(MAX_PASSWORD_LENGTH + 1) },
    },
    { name: "an empty password", body: { email: "ana@nexo.test", password: "" } },
    { name: "a missing e-mail", body: { password: "x" } },
  ])("rejects $name before touching the database", async ({ body }) => {
    const response = await POST(postBody(body));

    expect(response.status).toBe(HTTP_BAD_REQUEST);
    expect(await response.json()).toEqual({
      error: "Informe um e-mail corporativo válido e a senha.",
    });
  });
});
