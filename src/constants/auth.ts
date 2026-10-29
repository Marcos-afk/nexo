import type { LoginFormValues } from "@/models/auth";

export const DEFAULT_LOGIN_VALUES: LoginFormValues = {
  email: "",
  password: "",
  remember: true,
};

export const LOGIN_ENDPOINT = "/api/auth/login";
