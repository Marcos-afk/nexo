import type { ConversationMode } from "../../domain/conversation";
import type { conversations, decisions, drafts, messages } from "../schema";

type NewConversation = typeof conversations.$inferInsert;
type NewMessage = typeof messages.$inferInsert;
type NewDraft = typeof drafts.$inferInsert;
type NewDecision = typeof decisions.$inferInsert;

interface ConversationSeed {
  readonly id: string;
  readonly employeeId: string;
  readonly mode: ConversationMode;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly ticketId?: string;
  readonly handoffReason?: string;
  readonly handoffSummary?: string;
  readonly contactDueAt?: string;
  readonly lines: readonly (readonly [author: "employee" | "agent", content: string])[];
}

const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1000;
const AGENT_REPLY_SECONDS = 8;
const SEED_MODEL = "google/gemini-3.6-flash";
const SEED_TRIAGE_MODEL = "google/gemini-3.5-flash-lite";

const conversationSeeds: readonly ConversationSeed[] = [
  {
    id: "c-ana-handoff",
    employeeId: "emp-ana",
    mode: "awaiting_analyst",
    createdAt: "2026-10-28T09:30:00-03:00",
    updatedAt: "2026-10-28T09:40:00-03:00",
    ticketId: "t-inc-20311",
    handoffReason: "Pedido do funcionário",
    handoffSummary:
      "Ana pediu um atendente sobre o INC-20311 (notebook lento após a atualização do Windows). O agent já sugeriu reiniciar e liberar espaço em disco, sem sucesso.",
    contactDueAt: "2026-10-28T12:05:00-03:00",
    lines: [
      ["employee", "INC-20311 · Notebook lento após atualização"],
      ["agent", "Esse chamado está em aberto e já passou do prazo. Quer que eu chame um analista?"],
      ["employee", "Quero falar com uma pessoa, por favor."],
    ],
  },
  {
    id: "c-ana-chat",
    employeeId: "emp-ana",
    mode: "agent",
    createdAt: "2026-10-28T09:41:00-03:00",
    updatedAt: "2026-10-28T09:43:00-03:00",
    lines: [
      ["employee", "Meu monitor externo parou de dar imagem."],
      ["agent", "Preparei um rascunho do chamado. Confira e confirme se estiver certo."],
    ],
  },
  {
    id: "c-carla",
    employeeId: "emp-carla",
    mode: "awaiting_analyst",
    createdAt: "2026-10-28T09:35:00-03:00",
    updatedAt: "2026-10-28T09:43:00-03:00",
    handoffReason: "Pedido urgente de acesso",
    handoffSummary: "Carla precisa de acesso ao SAP ainda hoje para o fechamento.",
    contactDueAt: "2026-10-28T10:08:00-03:00",
    lines: [
      ["employee", "Preciso de acesso ao SAP ainda hoje."],
      ["agent", "Vou chamar um analista para tratar desse acesso."],
    ],
  },
  {
    id: "c-bruno",
    employeeId: "emp-bruno",
    mode: "awaiting_analyst",
    createdAt: "2026-10-28T09:10:00-03:00",
    updatedAt: "2026-10-28T09:25:00-03:00",
    handoffReason: "Baixa confiança do agent (41%)",
    handoffSummary:
      "Bruno descreveu uma falha intermitente que o agent não conseguiu classificar com segurança.",
    contactDueAt: "2026-10-28T11:43:00-03:00",
    lines: [
      ["employee", "Às vezes o sistema trava e some tudo da tela."],
      ["agent", "Não tenho segurança para resolver isso sozinho. Vou chamar um analista."],
    ],
  },
  {
    id: "c-diego",
    employeeId: "emp-diego",
    mode: "agent",
    createdAt: "2026-10-28T09:15:00-03:00",
    updatedAt: "2026-10-28T09:42:00-03:00",
    ticketId: "t-inc-20517",
    lines: [
      ["employee", "A VPN fica caindo a cada 10 minutos."],
      ["agent", "Abri o chamado INC-20517. Enquanto isso, tente reconectar pelo cliente de VPN."],
    ],
  },
  {
    id: "c-elisa",
    employeeId: "emp-elisa",
    mode: "agent",
    createdAt: "2026-10-28T09:28:00-03:00",
    updatedAt: "2026-10-28T09:31:00-03:00",
    ticketId: "t-inc-20519",
    lines: [
      ["employee", "A impressora do RH está sem conexão para todo mundo."],
      ["agent", "Abri o chamado INC-20519 com prioridade alta para o seu setor."],
    ],
  },
  {
    id: "c-fabio",
    employeeId: "emp-fabio",
    mode: "closed",
    createdAt: "2026-10-28T08:50:00-03:00",
    updatedAt: "2026-10-28T08:56:00-03:00",
    lines: [
      ["employee", "Qual é o horário do service desk?"],
      ["agent", "De segunda a sexta, das 8h às 18h. Chamados críticos têm plantão 24 horas."],
    ],
  },
  {
    id: "c-gabriela",
    employeeId: "emp-gabriela",
    mode: "closed",
    createdAt: "2026-10-27T16:00:00-03:00",
    updatedAt: "2026-10-27T16:10:00-03:00",
    lines: [
      ["employee", "Qual é a senha do Wi-Fi corporativo?"],
      ["agent", "Ela é enviada ao seu e-mail corporativo pelo portal de acessos, em Rede sem fio."],
    ],
  },
];

const toConversation = (seed: ConversationSeed): NewConversation => ({
  id: seed.id,
  employeeId: seed.employeeId,
  mode: seed.mode,
  handoffReason: seed.handoffReason ?? null,
  handoffSummary: seed.handoffSummary ?? null,
  contactDueAt: seed.contactDueAt ? new Date(seed.contactDueAt) : null,
  ticketId: seed.ticketId ?? null,
  createdAt: new Date(seed.createdAt),
  updatedAt: new Date(seed.updatedAt),
});

const gapBefore = (author: ConversationSeed["lines"][number][0]): number =>
  author === "agent" ? AGENT_REPLY_SECONDS * MS_PER_SECOND : MS_PER_MINUTE;

const toMessages = (seed: ConversationSeed): readonly NewMessage[] => {
  const startMs = new Date(seed.createdAt).getTime();
  const offsetOf = (index: number): number =>
    seed.lines.slice(1, index + 1).reduce((total, [author]) => total + gapBefore(author), 0);

  return seed.lines.map(([author, content], index) => ({
    id: `m-${seed.id}-${index + 1}`,
    conversationId: seed.id,
    authorKind: author,
    authorId: author === "employee" ? seed.employeeId : null,
    content,
    parts: null,
    createdAt: new Date(startMs + offsetOf(index)),
    deliveredAt: null,
    readAt: null,
  }));
};

export const seedConversations: readonly NewConversation[] = conversationSeeds.map(toConversation);
export const seedMessages: readonly NewMessage[] = conversationSeeds.flatMap(toMessages);

export const seedDrafts: readonly NewDraft[] = [
  {
    id: "D-381",
    conversationId: "c-ana-chat",
    mode: "create",
    targetTicketId: null,
    payload: {
      type: "incident",
      title: "Monitor externo sem imagem",
      description: "O monitor externo parou de dar imagem e o notebook não o reconhece.",
      category: "Hardware",
      subcategory: "Periféricos",
      priority: "high",
      affected: "Somente eu",
    },
    status: "pending",
    createdAt: new Date("2026-10-28T09:43:00-03:00"),
  },
];

export const seedDecisions: readonly NewDecision[] = [
  {
    id: "dec-ana-handoff",
    messageId: "m-c-ana-handoff-3",
    intent: "human_request",
    understood: "A funcionária pede para falar com uma pessoa.",
    action: "transfer",
    confidence: 95,
    rationale: "Pedido explícito de atendimento humano.",
    signals: ["asks_for_human"],
    toolCalls: null,
    tokensIn: null,
    tokensOut: null,
    latencyMs: null,
    model: SEED_TRIAGE_MODEL,
  },
  {
    id: "dec-bruno-low-confidence",
    messageId: "m-c-bruno-1",
    intent: "unclear",
    understood: "Falha intermitente de sistema sem detalhes suficientes.",
    action: "transfer",
    confidence: 41,
    rationale: "Descrição vaga e sem sistema identificado; abaixo do limiar de confiança.",
    signals: ["ambiguous", "missing_details"],
    toolCalls: null,
    tokensIn: null,
    tokensOut: null,
    latencyMs: null,
    model: SEED_MODEL,
  },
];
