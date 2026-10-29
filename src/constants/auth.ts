import type { LoginFormValues } from "@/models/auth";

export const DEFAULT_LOGIN_VALUES: LoginFormValues = {
  email: "",
  password: "",
  remember: true,
};

export const LOGIN_ENDPOINT = "/api/auth/login";
export const FORGOT_PASSWORD_ENDPOINT = "/api/auth/forgot-password";
export const PASSWORD_RESET_ENDPOINT = "/api/profile/password-reset";
export const LOGOUT_ENDPOINT = "/api/auth/logout";
