export const ticketStatuses = [
  "Aberto",
  "Em andamento",
  "Aguardando analista",
  "Em atendimento",
  "Aprovado",
  "Resolvido",
] as const;

export const ticketPriorities = ["Crítica", "Alta", "Média", "Baixa"] as const;

export type TicketStatus = (typeof ticketStatuses)[number];
export type TicketPriority = (typeof ticketPriorities)[number];

export interface Ticket {
  readonly number: string;
  readonly ownerId: string;
  readonly title: string;
  readonly status: TicketStatus;
  readonly priority: TicketPriority;
}

const sampleTickets: readonly Ticket[] = [
  {
    number: "INC-20311",
    ownerId: "emp-ana",
    title: "Notebook lento após atualização do Windows",
    status: "Aguardando analista",
    priority: "Média",
  },
  {
    number: "INC-20298",
    ownerId: "emp-ana",
    title: "Acesso à pasta Financeiro (SharePoint)",
    status: "Em andamento",
    priority: "Média",
  },
  {
    number: "REQ-10442",
    ownerId: "emp-ana",
    title: "Segundo monitor para home office",
    status: "Aprovado",
    priority: "Baixa",
  },
  {
    number: "INC-19877",
    ownerId: "emp-ana",
    title: "Outlook não sincroniza no celular",
    status: "Resolvido",
    priority: "Média",
  },
  {
    number: "INC-20402",
    ownerId: "emp-bruno",
    title: "Teclado do notebook com teclas falhando",
    status: "Aberto",
    priority: "Média",
  },
  {
    number: "INC-20410",
    ownerId: "emp-bruno",
    title: "Impressora do terceiro andar sem conexão",
    status: "Em andamento",
    priority: "Alta",
  },
];

export const listTicketsByOwner = (
  ownerId: string,
  status?: TicketStatus,
): readonly Ticket[] =>
  sampleTickets.filter(
    (ticket) => ticket.ownerId === ownerId && (status === undefined || ticket.status === status),
  );
