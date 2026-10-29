import type { z } from "zod";

export const parseEventData = <T>(raw: unknown, schema: z.ZodType<T>): T | null => {
  if (typeof raw !== "string") {
    return null;
  }

  try {
    const parsed = schema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};
