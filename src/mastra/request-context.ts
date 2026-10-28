import type { RequestContext } from "@mastra/core/request-context";
import { z } from "zod";
import { MissingEmployeeContextError } from "../domain/errors";

export const EMPLOYEE_ID_KEY = "employeeId";
export const CONVERSATION_ID_KEY = "conversationId";

const contextValueSchema = z.string().min(1);

const readContextValue = (requestContext: RequestContext, key: string): string => {
  const parsed = contextValueSchema.safeParse(requestContext.get(key));

  if (!parsed.success) {
    throw new MissingEmployeeContextError({ cause: parsed.error });
  }

  return parsed.data;
};

export const readEmployeeId = (requestContext: RequestContext): string =>
  readContextValue(requestContext, EMPLOYEE_ID_KEY);

export const readConversationId = (requestContext: RequestContext): string =>
  readContextValue(requestContext, CONVERSATION_ID_KEY);
