import { APP_DB_FILE, toLibSqlFileUrl } from "../config/data-paths";
import { type ConversationUsage, usageByConversation } from "../services/usage/usage-service";
import { secondsOf, tokensOf } from "../utils/usage-format";
import { createDatabase } from "./client";

const NO_VALUE = "—";

const rowOf = ({ conversationId, employeeName, mode, summary }: ConversationUsage) => ({
  conversa: conversationId,
  funcionario: employeeName,
  modo: mode,
  respostas: summary.turns,
  tokens: tokensOf(summary.totalTokens),
  entrada: tokensOf(summary.tokensIn),
  saida: tokensOf(summary.tokensOut),
  latenciaMedia: summary.averageLatencyMs === null ? NO_VALUE : secondsOf(summary.averageLatencyMs),
  latenciaMaxima: summary.maxLatencyMs === null ? NO_VALUE : secondsOf(summary.maxLatencyMs),
});

const run = async (): Promise<void> => {
  const database = createDatabase(toLibSqlFileUrl(APP_DB_FILE));
  const rows = await usageByConversation({ database });

  if (rows.length === 0) {
    process.stdout.write("Nenhuma decisão registrada ainda.\n");

    return;
  }

  const ranked = rows.toSorted((a, b) => b.summary.totalTokens - a.summary.totalTokens);
  const totalTokens = rows.reduce((sum, { summary }) => sum + summary.totalTokens, 0);

  process.stdout.write(`${JSON.stringify(ranked.map(rowOf), null, 2)}\n`);
  process.stdout.write(
    `Conversas com decisões: ${rows.length}. Tokens somados: ${tokensOf(totalTokens)}\n`,
  );
};

run().catch((error: unknown) => {
  process.stderr.write(`Falha ao gerar o relatório: ${String(error)}\n`);
  process.exitCode = 1;
});
