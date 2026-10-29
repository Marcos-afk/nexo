import { HOME_PATH_BY_ROLE } from "@/constants/routes";
import type { EmployeeRole } from "@/domain/employee";

export const homePathFor = (role: EmployeeRole): string => HOME_PATH_BY_ROLE[role];
