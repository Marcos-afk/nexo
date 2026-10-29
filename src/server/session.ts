import { cookies } from "next/headers";
import { UnauthenticatedError } from "../domain/errors";
import { isProduction } from "../env";
import type { AuthService, AuthSession } from "../services/auth/auth-service";

export const SESSION_COOKIE = "nexo_session";

const readSessionId = async (): Promise<string | null> =>
  (await cookies()).get(SESSION_COOKIE)?.value ?? null;

export const requireSession = async (auth: AuthService): Promise<AuthSession> => {
  const sessionId = await readSessionId();
  const session = sessionId ? await auth.resolve(sessionId) : null;

  if (!session) {
    throw new UnauthenticatedError();
  }

  return session;
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
