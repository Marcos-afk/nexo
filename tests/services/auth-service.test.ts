import { describe, expect, it } from "vitest";
import { UnknownEmployeeError } from "../../src/domain/errors";
import {
  BROWSER_SESSION_MS,
  createAuthService,
  REMEMBER_SESSION_MS,
} from "../../src/services/auth/auth-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T10:00:00-03:00";
const MS_PER_MINUTE = 60_000;

const setup = async (now: string = NOW) => {
  const database = await createSeededDatabase();

  return {
    database,
    auth: createAuthService({
      database,
      clock: createFixedClock(now),
      ids: createSequentialIds("session"),
    }),
  };
};

describe("login", () => {
  it.each([
    { name: "an employee", email: "ana@nexo.test", role: "employee" },
    { name: "an analyst", email: "rafael@nexo.test", role: "analyst" },
    { name: "an e-mail with spaces and capitals", email: "  Ana@Nexo.TEST ", role: "employee" },
  ])("accepts $name", async ({ email, role }) => {
    const { auth } = await setup();
    const session = await auth.login({ email, remember: true });

    expect(session.user.role).toBe(role);
  });

  it.each(["ninguem@nexo.test", "ana@outraempresa.com", ""])("refuses %j", async (email) => {
    const { auth } = await setup();

    await expect(auth.login({ email, remember: true })).rejects.toBeInstanceOf(
      UnknownEmployeeError,
    );
  });

  it.each([
    { name: "persists when remember is on", remember: true, lifetimeMs: REMEMBER_SESSION_MS },
    { name: "is short when remember is off", remember: false, lifetimeMs: BROWSER_SESSION_MS },
  ])("a session that $name", async ({ remember, lifetimeMs }) => {
    const { auth } = await setup();
    const session = await auth.login({ email: "ana@nexo.test", remember });

    expect(session.expiresAt.getTime() - new Date(NOW).getTime()).toBe(lifetimeMs);
    expect(session.remember).toBe(remember);
  });

  it("does not expose anything beyond the public profile", async () => {
    const { auth } = await setup();
    const session = await auth.login({ email: "ana@nexo.test", remember: true });

    expect(Object.keys(session.user).toSorted()).toEqual([
      "department",
      "email",
      "id",
      "name",
      "role",
    ]);
  });
});

describe("resolve", () => {
  it("returns the user of a valid session", async () => {
    const { auth } = await setup();
    const { id } = await auth.login({ email: "ana@nexo.test", remember: false });

    expect((await auth.resolve(id))?.user.id).toBe("emp-ana");
  });

  it("returns nothing for an unknown id", async () => {
    const { auth } = await setup();

    expect(await auth.resolve("not-a-session")).toBeNull();
  });

  it("returns nothing once the session has expired", async () => {
    const { database, auth } = await setup();
    const { id } = await auth.login({ email: "ana@nexo.test", remember: false });
    const later = new Date(new Date(NOW).getTime() + BROWSER_SESSION_MS + MS_PER_MINUTE);
    const afterExpiry = createAuthService({
      database,
      clock: { now: () => later },
      ids: createSequentialIds("later"),
    });

    expect(await afterExpiry.resolve(id)).toBeNull();
  });
});

describe("logout", () => {
  it("ends only the given session", async () => {
    const { auth } = await setup();
    const first = await auth.login({ email: "ana@nexo.test", remember: true });
    const second = await auth.login({ email: "ana@nexo.test", remember: true });

    await auth.logout(first.id);

    expect(await auth.resolve(first.id)).toBeNull();
    expect(await auth.resolve(second.id)).not.toBeNull();
  });
});
