import { beforeEach, describe, expect, it, vi } from "vitest";
import { withAnalyst, withSession } from "../../src/app/api/with-auth";
import { SessionMessageLimitReachedError } from "../../src/domain/errors";
import { SESSION_COOKIE } from "../../src/server/session";
import {
  type AuthService,
  BROWSER_SESSION_MS,
  createAuthService,
} from "../../src/services/auth/auth-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

interface TestParams {
  id: string;
}

interface TestState {
  token: string | undefined;
  deletedCookies: string[];
  auth: AuthService | undefined;
}

const state = vi.hoisted(
  (): TestState => ({ token: undefined, deletedCookies: [], auth: undefined }),
);

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (state.token === undefined ? undefined : { name, value: state.token }),
      delete: (name: string) => state.deletedCookies.push(name),
    }),
}));

vi.mock("@/server/container", () => ({
  getContainer: () => Promise.resolve({ auth: state.auth, chat: {} }),
}));

const NOW = "2026-10-28T10:00:00-03:00";
const MS_PER_MINUTE = 60_000;
const ANA = "ana@nexo.test";
const RAFAEL = "rafael@nexo.test";

const routeContext = { params: Promise.resolve({ id: "d-1" }) };
const request = () => new Request("http://localhost/api/test");

const setup = async () => {
  const database = await createSeededDatabase();
  const buildAuth = (now: string) =>
    createAuthService({
      database,
      clock: createFixedClock(now),
      ids: createSequentialIds("token"),
    });

  state.auth = buildAuth(NOW);

  return { buildAuth, auth: state.auth };
};

const loginAs = async (email: string) => {
  const { auth } = await setup();
  const session = await auth.login({ email, remember: false });

  state.token = session.id;
};

const handlerReply = vi.fn((_request: Request, context: { session: { user: { id: string } } }) =>
  Promise.resolve(Response.json({ userId: context.session.user.id })),
);

beforeEach(() => {
  state.token = undefined;
  state.deletedCookies = [];
  handlerReply.mockClear();
});

describe("withSession", () => {
  it("answers 401 without calling the handler when there is no cookie", async () => {
    await setup();
    const response = await withSession<TestParams>(handlerReply)(request(), routeContext);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "unauthenticated" });
    expect(handlerReply).not.toHaveBeenCalled();
    expect(state.deletedCookies).toEqual([]);
  });

  it("answers 401 and drops the cookie when the token is unknown", async () => {
    await setup();
    state.token = "forged-token";
    const response = await withSession<TestParams>(handlerReply)(request(), routeContext);

    expect(response.status).toBe(401);
    expect(handlerReply).not.toHaveBeenCalled();
    expect(state.deletedCookies).toEqual([SESSION_COOKIE]);
  });

  it("answers 401 and drops the cookie when the session has expired", async () => {
    const { buildAuth, auth } = await setup();
    const { id } = await auth.login({ email: ANA, remember: false });
    const later = new Date(new Date(NOW).getTime() + BROWSER_SESSION_MS + MS_PER_MINUTE);

    state.auth = buildAuth(later.toISOString());
    state.token = id;
    const response = await withSession<TestParams>(handlerReply)(request(), routeContext);

    expect(response.status).toBe(401);
    expect(state.deletedCookies).toEqual([SESSION_COOKIE]);
  });

  it.each([ANA, RAFAEL])("lets %s through and hands the session to the handler", async (email) => {
    await loginAs(email);
    const response = await withSession<TestParams>(handlerReply)(request(), routeContext);

    expect(response.status).toBe(200);
    expect(handlerReply).toHaveBeenCalledTimes(1);
    expect(await response.json()).toEqual({ userId: email === ANA ? "emp-ana" : "analyst-rafael" });
  });

  it("passes the route params to the handler", async () => {
    await loginAs(ANA);
    const params = vi.fn((_request: Request, context: { params: Promise<{ id: string }> }) =>
      context.params.then(({ id }) => Response.json({ id })),
    );
    const response = await withSession<TestParams>(params)(request(), routeContext);

    expect(await response.json()).toEqual({ id: "d-1" });
  });

  it("maps a known domain error thrown by the handler", async () => {
    await loginAs(ANA);
    const failing = withSession<TestParams>(() =>
      Promise.reject(new SessionMessageLimitReachedError(30)),
    );
    const response = await failing(request(), routeContext);

    expect(response.status).toBe(429);
  });
});

describe("withAnalyst", () => {
  it("refuses an employee with 403 and never calls the handler", async () => {
    await loginAs(ANA);
    const response = await withAnalyst<TestParams>(handlerReply)(request(), routeContext);

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "analyst_required" });
    expect(handlerReply).not.toHaveBeenCalled();
  });

  it("lets an analyst through", async () => {
    await loginAs(RAFAEL);
    const response = await withAnalyst<TestParams>(handlerReply)(request(), routeContext);

    expect(response.status).toBe(200);
  });

  it("still answers 401, not 403, when there is no session", async () => {
    await setup();
    const response = await withAnalyst<TestParams>(handlerReply)(request(), routeContext);

    expect(response.status).toBe(401);
  });
});
