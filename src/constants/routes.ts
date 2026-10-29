import type { EmployeeRole } from "@/domain/employee";

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/";
export const CONSOLE_PATH = "/console";
export const FORGOT_PASSWORD_PATH = "/esqueci-minha-senha";
export const PRIVACY_PATH = "/privacidade";

export const GUEST_ONLY_PATHS: ReadonlySet<string> = new Set([LOGIN_PATH, FORGOT_PASSWORD_PATH]);
export const PUBLIC_PATHS: ReadonlySet<string> = new Set([PRIVACY_PATH]);

export const HOME_PATH_BY_ROLE = {
  employee: HOME_PATH,
  analyst: CONSOLE_PATH,
} as const satisfies Record<EmployeeRole, string>;
