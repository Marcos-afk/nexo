import { z } from "zod";

export interface ToolTraceEntry {
  readonly callId: string;
  readonly name: string;
  readonly input: unknown;
  readonly summary: string | null;
  readonly durationMs: number | null;
  readonly failed: boolean;
}

export interface ToolOutcome {
  readonly summary: string | null;
  readonly failed: boolean;
}

const failureSchema = z.object({ error: z.string() });
const ticketListSchema = z.object({ tickets: z.array(z.unknown()) });
const ticketSchema = z.object({ ticket: z.object({ number: z.string(), status: z.string() }) });
const articlesSchema = z.object({ articles: z.array(z.unknown()) });
const similarSchema = z.object({
  open: z.array(z.unknown()),
  recentlyResolved: z.array(z.unknown()),
});
const draftSchema = z.object({ draftId: z.string(), mode: z.string() });
const handoffSchema = z.object({ mode: z.string() });
const choicesSchema = z.object({ options: z.array(z.unknown()) });

const storedEntrySchema = z.object({
  callId: z.string().optional(),
  name: z.string(),
  input: z.unknown().optional(),
  args: z.unknown().optional(),
  summary: z.string().nullable().optional(),
  durationMs: z.number().nullable().optional(),
  failed: z.boolean().optional(),
});

const LEGACY_CALL_PREFIX = "legacy-";

const countOf = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;

type Summarizer = (output: unknown) => string | null;

const SUMMARIZERS: Readonly<Record<string, Summarizer>> = {
  listMyTickets: (output) => {
    const parsed = ticketListSchema.safeParse(output);

    return parsed.success ? countOf(parsed.data.tickets.length, "chamado", "chamados") : null;
  },
  getTicket: (output) => {
    const parsed = ticketSchema.safeParse(output);

    return parsed.success ? `${parsed.data.ticket.number} · ${parsed.data.ticket.status}` : null;
  },
  searchHelpArticles: (output) => {
    const parsed = articlesSchema.safeParse(output);

    return parsed.success ? countOf(parsed.data.articles.length, "artigo", "artigos") : null;
  },
  findSimilarTickets: (output) => {
    const parsed = similarSchema.safeParse(output);

    return parsed.success
      ? `${parsed.data.open.length} em aberto, ${parsed.data.recentlyResolved.length} resolvidos recentemente`
      : null;
  },
  buildDraft: (output) => {
    const parsed = draftSchema.safeParse(output);

    return parsed.success ? `Rascunho ${parsed.data.draftId} (${parsed.data.mode})` : null;
  },
  requestHandoff: (output) => {
    const parsed = handoffSchema.safeParse(output);

    return parsed.success ? `Conversa em ${parsed.data.mode}` : null;
  },
  offerChoices: (output) => {
    const parsed = choicesSchema.safeParse(output);

    return parsed.success ? countOf(parsed.data.options.length, "opção", "opções") : null;
  },
};

export const summarizeToolOutput = (name: string, output: unknown): ToolOutcome => {
  const failure = failureSchema.safeParse(output);

  if (failure.success) {
    return { summary: failure.data.error, failed: true };
  }

  return { summary: SUMMARIZERS[name]?.(output) ?? null, failed: false };
};

export const parseToolTrace = (raw: unknown): ToolTraceEntry[] => {
  const list = z.array(z.unknown()).safeParse(raw);

  if (!list.success) {
    return [];
  }

  return list.data.flatMap((item, index) => {
    const entry = storedEntrySchema.safeParse(item);

    return entry.success
      ? [
          {
            callId: entry.data.callId ?? `${LEGACY_CALL_PREFIX}${index}`,
            name: entry.data.name,
            input: entry.data.input ?? entry.data.args ?? null,
            summary: entry.data.summary ?? null,
            durationMs: entry.data.durationMs ?? null,
            failed: entry.data.failed ?? false,
          },
        ]
      : [];
  });
};
