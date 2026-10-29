import { z } from "zod";
import { employeeRoles } from "@/domain/employee";
import type { LoginResponseProps } from "@/models/auth";

export const EMPTY_EMAIL_MESSAGE = "Informe seu e-mail corporativo.";
export const INVALID_EMAIL_MESSAGE = "Digite um e-mail válido, como nome@nexo.com.br.";
export const EMPTY_PASSWORD_MESSAGE = "Informe sua senha.";

export const loginSchema = z.object({
  email: z.string().trim().min(1, EMPTY_EMAIL_MESSAGE).pipe(z.email(INVALID_EMAIL_MESSAGE)),
  password: z.string().min(1, EMPTY_PASSWORD_MESSAGE),
  remember: z.boolean(),
});

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    department: z.string(),
    role: z.enum(employeeRoles),
  }),
}) satisfies z.ZodType<LoginResponseProps>;

export const logoutResponseSchema = z.void();
