import { z } from "zod";
import { employeeRoles } from "@/domain/employee";
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH } from "@/domain/input-limits";
import type { ForgotPasswordResponseProps, LoginResponseProps } from "@/models/auth";

export const EMPTY_EMAIL_MESSAGE = "Informe seu e-mail corporativo.";
export const INVALID_EMAIL_MESSAGE = "Digite um e-mail válido, como nome@nexo.com.br.";
export const EMPTY_PASSWORD_MESSAGE = "Informe sua senha.";
export const LONG_EMAIL_MESSAGE = `O e-mail pode ter até ${MAX_EMAIL_LENGTH} caracteres.`;
export const LONG_PASSWORD_MESSAGE = `A senha pode ter até ${MAX_PASSWORD_LENGTH} caracteres.`;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, EMPTY_EMAIL_MESSAGE)
    .max(MAX_EMAIL_LENGTH, LONG_EMAIL_MESSAGE)
    .pipe(z.email(INVALID_EMAIL_MESSAGE)),
  password: z
    .string()
    .min(1, EMPTY_PASSWORD_MESSAGE)
    .max(MAX_PASSWORD_LENGTH, LONG_PASSWORD_MESSAGE),
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

export const forgotPasswordSchema = z.object({ email: loginSchema.shape.email });

export const forgotPasswordResponseSchema = z.object({
  requested: z.literal(true),
}) satisfies z.ZodType<ForgotPasswordResponseProps>;
