import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { employees, sessions } from "../../db/schema";
import type { EmployeeRole } from "../../domain/employee";
import { UnknownEmployeeError } from "../../domain/errors";
import type { Clock } from "../../lib/clock";
import type { IdGenerator } from "../../lib/ids";
import type { Logger } from "../../lib/logger";

const MS_PER_HOUR = 3_600_000;
const HOURS_PER_DAY = 24;
const REMEMBER_SESSION_DAYS = 30;
const BROWSER_SESSION_HOURS = 12;

export const REMEMBER_SESSION_MS = REMEMBER_SESSION_DAYS * HOURS_PER_DAY * MS_PER_HOUR;
export const BROWSER_SESSION_MS = BROWSER_SESSION_HOURS * MS_PER_HOUR;

export interface AuthServiceDeps {
  readonly database: Database;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger?: Logger;
}

export interface Profile {
  readonly name: string;
  readonly email: string;
  readonly department: string;
  readonly passwordChangedAt: Date | null;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly department: string;
  readonly role: EmployeeRole;
}

export interface AuthSession {
  readonly id: string;
  readonly remember: boolean;
  readonly expiresAt: Date;
  readonly user: AuthenticatedUser;
}

export interface LoginInput {
  readonly email: string;
  readonly remember: boolean;
}

const userColumns = {
  id: employees.id,
  name: employees.name,
  email: employees.email,
  department: employees.department,
  role: employees.role,
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const login = async (
  { database, clock, ids }: AuthServiceDeps,
  { email, remember }: LoginInput,
): Promise<AuthSession> => {
  const [user] = await database
    .select(userColumns)
    .from(employees)
    .where(eq(employees.email, normalizeEmail(email)));

  if (!user) {
    throw new UnknownEmployeeError();
  }

  const now = clock.now();
  const lifetimeMs = remember ? REMEMBER_SESSION_MS : BROWSER_SESSION_MS;
  const session = {
    id: ids.next(),
    employeeId: user.id,
    remember,
    userMessageCount: 0,
    createdAt: now,
    expiresAt: new Date(now.getTime() + lifetimeMs),
  };

  await database.insert(sessions).values(session);

  return { id: session.id, remember, expiresAt: session.expiresAt, user };
};

export const resolveSession = async (
  { database, clock }: Pick<AuthServiceDeps, "database" | "clock">,
  sessionId: string,
): Promise<AuthSession | null> => {
  const [row] = await database
    .select({
      id: sessions.id,
      remember: sessions.remember,
      expiresAt: sessions.expiresAt,
      user: userColumns,
    })
    .from(sessions)
    .innerJoin(employees, eq(sessions.employeeId, employees.id))
    .where(eq(sessions.id, sessionId));

  return row && row.expiresAt.getTime() > clock.now().getTime() ? row : null;
};

export const logout = async (
  { database }: Pick<AuthServiceDeps, "database">,
  sessionId: string,
): Promise<void> => {
  await database.delete(sessions).where(eq(sessions.id, sessionId));
};

export const getProfile = async (
  { database }: Pick<AuthServiceDeps, "database">,
  employeeId: string,
): Promise<Profile> => {
  const [profile] = await database
    .select({
      name: employees.name,
      email: employees.email,
      department: employees.department,
      passwordChangedAt: employees.passwordChangedAt,
    })
    .from(employees)
    .where(eq(employees.id, employeeId));

  if (!profile) {
    throw new UnknownEmployeeError();
  }

  return profile;
};

export const requestPasswordReset = async (
  deps: AuthServiceDeps,
  employeeId: string,
): Promise<void> => {
  await getProfile(deps, employeeId);

  deps.logger?.info({ employeeId }, "Password reset requested (simulated, no e-mail sent)");
};

export const createAuthService = (deps: AuthServiceDeps) => ({
  login: (input: LoginInput) => login(deps, input),
  resolve: (sessionId: string) => resolveSession(deps, sessionId),
  logout: (sessionId: string) => logout(deps, sessionId),
  profile: (employeeId: string) => getProfile(deps, employeeId),
  requestPasswordReset: (employeeId: string) => requestPasswordReset(deps, employeeId),
});

export type AuthService = ReturnType<typeof createAuthService>;
