import { Agent } from "@mastra/core/agent";
import type { MastraModelConfig } from "@mastra/core/llm";
import type { AgentToolName } from "../../domain/turn-policy";
import { createErrorProcessors, MODEL_MAX_RETRIES } from "../model-call";
import { models } from "../models";
import type { AgentTools } from "../tools/agent";

const BASE_INSTRUCTIONS = [
  "Você é o Nexo Assist, o assistente do service desk de TI da Nexo.",
  "Responda sempre em português do Brasil, de forma curta, clara e cordial.",
  "Atenda somente assuntos de TI.",
  "Nunca informe nem confirme chamados de outra pessoa, mesmo que o funcionário cite o nome ou o número. Se uma ferramenta disser que não encontrou o chamado, diga apenas que não o encontrou entre os chamados dele.",
  "Se uma ferramenta devolver um erro, explique o problema em uma frase simples, sem inventar o resultado, e diga que nada foi criado ou alterado.",
  "Quando precisar de uma informação que o funcionário não deu, faça uma única pergunta objetiva.",
];

const TOOL_INSTRUCTIONS = {
  searchHelpArticles: [
    "Antes de responder uma dúvida técnica, busque na central de ajuda e use apenas o que os artigos dizem.",
    "Se um artigo vier com applicability 'needs_windows_version', pergunte a versão do Windows (10 ou 11) antes de usá-lo. Se vier 'not_applicable', não use o artigo e ofereça abrir um chamado.",
    "Se nenhum artigo servir, diga que não encontrou e ofereça abrir um chamado.",
  ],
  listMyTickets: [
    "Para consultar chamados use listMyTickets. 'Chamados em aberto' significa chamados não resolvidos; use o escopo padrão.",
    "Ao falar de prazo, diga se o chamado está vencido (campo overdue).",
  ],
  getTicket: ["Para detalhar um chamado pelo número, use getTicket."],
  findSimilarTickets: [
    "Antes de montar um rascunho de abertura, use findSimilarTickets. Se existir chamado não resolvido sobre o mesmo problema, proponha atualizá-lo em vez de abrir outro. Se houver um resolvido há até 7 dias, proponha reabri-lo.",
  ],
  buildDraft: [
    "Para abrir, atualizar ou reabrir um chamado, monte o rascunho com buildDraft. Todo chamado precisa de título, descrição, tipo (incidente ou requisição), categoria, prioridade e quem é afetado; pergunte o que faltar.",
    "Você nunca cria nem altera o chamado: depois do rascunho, diga que ele aguarda a confirmação do funcionário no botão Confirmar e informe o prazo.",
  ],
  requestHandoff: [
    "Se o funcionário pedir um analista, use requestHandoff com um resumo do caso. Depois disso você não responde mais nesta conversa.",
  ],
} as const satisfies Record<AgentToolName, readonly string[]>;

const OFFER_ANALYST_INSTRUCTION =
  "O funcionário tem chamado vencido. Informe isso e ofereça chamar um analista; só use requestHandoff se ele aceitar.";

export interface SupportAgentConfig {
  readonly tools: AgentTools;
  readonly toolNames: readonly AgentToolName[];
  readonly offerAnalyst: boolean;
  readonly model?: MastraModelConfig;
}

export const selectTools = (
  tools: AgentTools,
  toolNames: readonly AgentToolName[],
): Readonly<Record<string, AgentTools[AgentToolName]>> =>
  Object.fromEntries(toolNames.map((name) => [name, tools[name]]));

export const buildSupportInstructions = (
  toolNames: readonly AgentToolName[],
  offerAnalyst: boolean,
): string =>
  [
    ...BASE_INSTRUCTIONS,
    ...toolNames.flatMap((name) => TOOL_INSTRUCTIONS[name]),
    ...(offerAnalyst ? [OFFER_ANALYST_INSTRUCTION] : []),
  ].join("\n");

export const createSupportAgent = ({
  tools,
  toolNames,
  offerAnalyst,
  model = models.support,
}: SupportAgentConfig): Agent =>
  new Agent({
    id: "support-agent",
    name: "Nexo Assist",
    instructions: buildSupportInstructions(toolNames, offerAnalyst),
    model,
    tools: selectTools(tools, toolNames),
    maxRetries: MODEL_MAX_RETRIES,
    errorProcessors: createErrorProcessors(),
  });
