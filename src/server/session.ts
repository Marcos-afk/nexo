import { cookies } from "next/headers";
import { UnauthenticatedError } from "../domain/errors";
import { isProduction } from "../env";
import type { AuthService, AuthSession } from "../services/auth/auth-service";
import { SESSION_COOKIE } from "./session-cookie";

export { SESSION_COOKIE };

const readSessionId = async (): Promise<string | null> =>
  (await cookies()).get(SESSION_COOKIE)?.value ?? null;

export const requireSession = async (auth: AuthService): Promise<AuthSession> => {
  const sessionId = await readSessionId();
  const session = sessionId ? await auth.resolve(sessionId) : null;

  if (session) {
    return session;
  }

  if (sessionId) {
    (await cookies()).delete(SESSION_COOKIE);
  }

  throw new UnauthenticatedError();
};

export const endSession = async (auth: AuthService): Promise<void> => {
  const sessionId = await readSessionId();

  if (sessionId) {
    await auth.logout(sessionId);
  }

  (await cookies()).delete(SESSION_COOKIE);
};

export const startSessionCookie = async (session: AuthSession): Promise<void> => {
  (await cookies()).set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    ...(session.remember ? { expires: session.expiresAt } : {}),
  });
};

export const findSession = async (auth: AuthService): Promise<AuthSession | null> => {
  const sessionId = await readSessionId();

  return sessionId ? auth.resolve(sessionId) : null;
};
