import type { EmployeeRole } from "@/domain/employee";

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/";

export const HOME_PATH_BY_ROLE = {
  employee: HOME_PATH,
  analyst: HOME_PATH,
} as const satisfies Record<EmployeeRole, string>;
