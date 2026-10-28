import { computeDueAt, type TicketPriority } from "../../domain/sla";
import type { TicketEventKind, TicketStatus, TicketType } from "../../domain/ticket";
import type { ticketEvents, tickets } from "../schema";

type NewTicket = typeof tickets.$inferInsert;
type NewTicketEvent = typeof ticketEvents.$inferInsert;

interface TicketSeed {
  readonly number: string;
  readonly type: TicketType;
  readonly ownerId: string;
  readonly category: string;
  readonly subcategory: string;
  readonly title: string;
  readonly description: string;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly affected: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt?: string;
  readonly actor: string;
}

const ticketSeeds: readonly TicketSeed[] = [
  {
    number: "INC-20311",
    type: "incident",
    ownerId: "emp-ana",
    category: "Hardware",
    subcategory: "Notebook",
    title: "Notebook lento após atualização do Windows",
    description:
      "Depois da atualização do Windows, o notebook demora para abrir programas e trava com frequência.",
    priority: "medium",
    status: "awaiting_analyst",
    affected: "Somente eu",
    createdAt: "2026-10-16T14:20:00-03:00",
    updatedAt: "2026-10-23T09:43:00-03:00",
    actor: "emp-ana",
  },
  {
    number: "INC-20298",
    type: "incident",
    ownerId: "emp-ana",
    category: "Acesso",
    subcategory: "SharePoint",
    title: "Acesso à pasta Financeiro (SharePoint)",
    description: "Não consigo abrir a pasta Financeiro no SharePoint desde segunda-feira.",
    priority: "medium",
    status: "in_progress",
    affected: "Equipe Financeiro",
    createdAt: "2026-10-14T10:05:00-03:00",
    updatedAt: "2026-10-26T15:30:00-03:00",
    actor: "emp-ana",
  },
  {
    number: "REQ-10442",
    type: "request",
    ownerId: "emp-ana",
    category: "Equipamento",
    subcategory: "Periféricos",
    title: "Segundo monitor para home office",
    description: "Solicito um segundo monitor para trabalhar em home office.",
    priority: "low",
    status: "approved",
    affected: "Somente eu",
    createdAt: "2026-10-09T11:00:00-03:00",
    updatedAt: "2026-10-20T16:10:00-03:00",
    actor: "emp-ana",
  },
  {
    number: "INC-19877",
    type: "incident",
    ownerId: "emp-ana",
    category: "E-mail",
    subcategory: "Outlook",
    title: "Outlook não sincroniza no celular",
    description: "O Outlook no celular parou de receber e-mails novos.",
    priority: "medium",
    status: "resolved",
    affected: "Somente eu",
    createdAt: "2026-09-01T09:15:00-03:00",
    updatedAt: "2026-09-02T14:00:00-03:00",
    resolvedAt: "2026-09-02T14:00:00-03:00",
    actor: "analyst-rafael",
  },
  {
    number: "INC-19410",
    type: "incident",
    ownerId: "emp-ana",
    category: "Acesso",
    subcategory: "Senha",
    title: "Troca de senha da rede",
    description: "Preciso trocar a senha da rede, que expirou.",
    priority: "low",
    status: "resolved",
    affected: "Somente eu",
    createdAt: "2026-07-10T16:40:00-03:00",
    updatedAt: "2026-07-11T10:00:00-03:00",
    resolvedAt: "2026-07-11T10:00:00-03:00",
    actor: "analyst-rafael",
  },
  {
    number: "INC-20150",
    type: "incident",
    ownerId: "emp-carla",
    category: "Acesso",
    subcategory: "SAP",
    title: "Acesso ao módulo de contas a pagar no SAP",
    description: "Preciso de acesso ao módulo de contas a pagar do SAP para o fechamento do mês.",
    priority: "high",
    status: "resolved",
    affected: "Somente eu",
    createdAt: "2026-10-23T09:00:00-03:00",
    updatedAt: "2026-10-24T11:20:00-03:00",
    resolvedAt: "2026-10-24T11:20:00-03:00",
    actor: "analyst-rafael",
  },
  {
    number: "INC-20517",
    type: "incident",
    ownerId: "emp-diego",
    category: "Rede",
    subcategory: "VPN",
    title: "VPN desconecta a cada 10 minutos",
    description: "A VPN cai a cada 10 minutos e preciso reconectar manualmente.",
    priority: "medium",
    status: "open",
    affected: "Somente eu",
    createdAt: "2026-10-28T09:20:00-03:00",
    updatedAt: "2026-10-28T09:20:00-03:00",
    actor: "emp-diego",
  },
  {
    number: "INC-20519",
    type: "incident",
    ownerId: "emp-elisa",
    category: "Hardware",
    subcategory: "Impressora",
    title: "Impressora do RH sem conexão",
    description: "A impressora do setor de RH aparece offline para todos.",
    priority: "high",
    status: "open",
    affected: "Equipe Recursos Humanos",
    createdAt: "2026-10-28T09:30:00-03:00",
    updatedAt: "2026-10-28T09:30:00-03:00",
    actor: "agent",
  },
];

const ticketIdOf = (number: string): string => `t-${number.toLowerCase()}`;

const toTicket = (seed: TicketSeed): NewTicket => {
  const createdAt = new Date(seed.createdAt);

  return {
    id: ticketIdOf(seed.number),
    number: seed.number,
    type: seed.type,
    category: seed.category,
    subcategory: seed.subcategory,
    title: seed.title,
    description: seed.description,
    priority: seed.priority,
    status: seed.status,
    ownerId: seed.ownerId,
    affected: seed.affected,
    createdAt,
    updatedAt: new Date(seed.updatedAt),
    dueAt: computeDueAt(seed.priority, createdAt),
    resolvedAt: seed.resolvedAt ? new Date(seed.resolvedAt) : null,
  };
};

const toEvent = (
  seed: TicketSeed,
  kind: TicketEventKind,
  actor: string,
  at: string,
): NewTicketEvent => ({
  id: `te-${seed.number.toLowerCase()}-${kind}`,
  ticketId: ticketIdOf(seed.number),
  kind,
  actor,
  payload: null,
  createdAt: new Date(at),
});

const toEvents = (seed: TicketSeed): readonly NewTicketEvent[] => [
  toEvent(seed, "created", seed.actor === "agent" ? "agent" : seed.ownerId, seed.createdAt),
  ...(seed.resolvedAt ? [toEvent(seed, "resolved", seed.actor, seed.resolvedAt)] : []),
];

export const seedTickets: readonly NewTicket[] = ticketSeeds.map(toTicket);
export const seedTicketEvents: readonly NewTicketEvent[] = ticketSeeds.flatMap(toEvents);
