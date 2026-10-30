import { z } from "zod";
import { InvalidEnvironmentError } from "./domain/errors";

const environments = ["development", "production", "test"] as const;

const blankAsMissing = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(environments).default("development"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.preprocess(blankAsMissing, z.string().min(1).optional()),
  LEGACY_OUTAGE_SECONDS: z.coerce.number().nonnegative().default(0),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (source: Readonly<Record<string, string | undefined>>): Env => {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const variables = parsed.error.issues.map((issue) => String(issue.path[0]));

    throw new InvalidEnvironmentError([...new Set(variables)], { cause: parsed.error });
  }

  return parsed.data;
};

export const env: Env = parseEnv(process.env);

export const isProduction = env.NODE_ENV === "production";
