import type { RequestContext } from "@mastra/core/request-context";
import { z } from "zod";
import { MissingEmployeeContextError } from "../domain/errors";

export const EMPLOYEE_ID_KEY = "employeeId";

const employeeIdSchema = z.string().min(1);

export const readEmployeeId = (requestContext: RequestContext): string => {
  const parsed = employeeIdSchema.safeParse(requestContext.get(EMPLOYEE_ID_KEY));

  if (!parsed.success) {
    throw new MissingEmployeeContextError({ cause: parsed.error });
  }

  return parsed.data;
};
