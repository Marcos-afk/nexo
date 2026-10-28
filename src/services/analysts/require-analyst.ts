import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { employees } from "../../db/schema";
import { AnalystRequiredError } from "../../domain/errors";

export type Analyst = typeof employees.$inferSelect;

export const requireAnalyst = async (
  executor: Pick<Database, "select">,
  analystId: string,
): Promise<Analyst> => {
  const [analyst] = await executor
    .select()
    .from(employees)
    .where(and(eq(employees.id, analystId), eq(employees.role, "analyst")));

  if (!analyst) {
    throw new AnalystRequiredError();
  }

  return analyst;
};
