import { ApiError } from "@/lib/api";

export const errorMessageOf = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback;
