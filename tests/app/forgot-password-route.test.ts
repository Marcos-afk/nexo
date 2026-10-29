import { describe, expect, it } from "vitest";
import { POST } from "../../src/app/api/auth/forgot-password/route";

const HTTP_BAD_REQUEST = 400;

const postBody = (body: unknown): Request =>
  new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/auth/forgot-password", () => {
  it.each([
    { name: "a registered e-mail", email: "ana@nexo.test" },
    { name: "an unknown e-mail", email: "ninguem@outra-empresa.com" },
    { name: "an e-mail with surrounding spaces", email: "  ana@nexo.test  " },
  ])("answers the same for $name", async ({ email }) => {
    const response = await POST(postBody({ email }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ requested: true });
  });

  it.each([
    { name: "an empty e-mail", body: { email: "" } },
    { name: "an invalid e-mail", body: { email: "ana.nexo" } },
    { name: "a missing e-mail", body: {} },
    { name: "a body that is not JSON", body: "oops" },
  ])("rejects $name", async ({ body }) => {
    const response = await POST(postBody(body));

    expect(response.status).toBe(HTTP_BAD_REQUEST);
    expect(await response.json()).toEqual({ error: "Informe um e-mail corporativo válido." });
  });
});
