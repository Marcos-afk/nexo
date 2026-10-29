import type { EmployeeRole } from "@/domain/employee";

export interface AuthUserProps {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly department: string;
  readonly role: EmployeeRole;
}

export interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export interface LoginResponseProps {
  readonly user: AuthUserProps;
}
