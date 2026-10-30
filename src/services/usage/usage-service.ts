import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { conversations, decisions, employees, messages } from "../../db/schema";
import type { ConversationMode } from "../../domain/conversation";
import { summarizeUsage, type TurnUsage, type UsageSummary } from "../../domain/usage";

export interface UsageServiceDeps {
  readonly database: Database;
}

export interface ConversationUsage {
  readonly conversationId: string;
  readonly employeeName: string;
  readonly mode: ConversationMode;
  readonly summary: UsageSummary;
}

const turnColumns = {
  tokensIn: decisions.tokensIn,
  tokensOut: decisions.tokensOut,
  latencyMs: decisions.latencyMs,
  model: decisions.model,
};

export const conversationTurns = async (
  { database }: UsageServiceDeps,
  conversationId: string,
): Promise<readonly TurnUsage[]> =>
  database
    .select(turnColumns)
    .from(decisions)
    .innerJoin(messages, eq(decisions.messageId, messages.id))
    .where(eq(messages.conversationId, conversationId));

export const conversationUsage = async (
  deps: UsageServiceDeps,
  conversationId: string,
): Promise<UsageSummary> => summarizeUsage(await conversationTurns(deps, conversationId));

export const usageByConversation = async ({
  database,
}: UsageServiceDeps): Promise<readonly ConversationUsage[]> => {
  const rows = await database
    .select({
      ...turnColumns,
      conversationId: conversations.id,
      employeeName: employees.name,
      mode: conversations.mode,
    })
    .from(decisions)
    .innerJoin(messages, eq(decisions.messageId, messages.id))
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(employees, eq(conversations.employeeId, employees.id));
  const grouped = rows.reduce(
    (groups, row) =>
      groups.set(row.conversationId, [...(groups.get(row.conversationId) ?? []), row]),
    new Map<string, typeof rows>(),
  );

  return [...grouped.entries()].map(([conversationId, turns]) => ({
    conversationId,
    employeeName: turns[0]?.employeeName ?? "",
    mode: turns[0]?.mode ?? "agent",
    summary: summarizeUsage(turns),
  }));
};
