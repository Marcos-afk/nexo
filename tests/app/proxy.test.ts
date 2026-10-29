import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "../../src/proxy";
import { SESSION_COOKIE } from "../../src/server/session-cookie";

const requestTo = (path: string, cookie?: string): NextRequest =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : {},
  });

const matcherPattern = new RegExp(`^${config.matcher[0]}$`);

describe("proxy", () => {
  it("lets a request with the session cookie through", () => {
    const response = proxy(requestTo("/", "abc"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("sends a logged-in visitor away from the login page", () => {
    const response = proxy(requestTo("/login", "abc"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("lets a visitor without the cookie reach the login page", () => {
    const response = proxy(requestTo("/login"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects to the login page without the session cookie", () => {
    const response = proxy(requestTo("/perfil"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it.each([
    { path: "/", guarded: true },
    { path: "/perfil", guarded: true },
    { path: "/login", guarded: true },
    { path: "/api/chat", guarded: false },
    { path: "/_next/static/chunk.js", guarded: false },
    { path: "/favicon.ico", guarded: false },
  ])("matcher guards $path: $guarded", ({ path, guarded }) => {
    expect(matcherPattern.test(path)).toBe(guarded);
  });
});
