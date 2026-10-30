import type { TicketPriority } from "./sla";

export const CRITICAL_NEEDS_WIDE_IMPACT_MESSAGE =
  "A prioridade crítica vale só quando uma equipe ou a empresa inteira é afetada.";

const WIDE_IMPACT_TERMS: ReadonlySet<string> = new Set([
  "equipe",
  "time",
  "setor",
  "departamento",
  "area",
  "empresa",
  "todos",
  "todas",
  "toda",
  "filial",
  "unidade",
  "diretoria",
  "grupo",
  "pessoas",
]);

const WORD_SEPARATOR = /[^a-z0-9]+/;

const stripAccents = (text: string): string => text.normalize("NFD").replace(/\p{Diacritic}/gu, "");

export const affectsTeamOrCompany = (affected: string | null): boolean =>
  affected !== null &&
  stripAccents(affected.toLowerCase())
    .split(WORD_SEPARATOR)
    .some((word) => WIDE_IMPACT_TERMS.has(word));

export const isPriorityConsistent = (priority: TicketPriority, affected: string | null): boolean =>
  priority !== "critical" || affectsTeamOrCompany(affected);
