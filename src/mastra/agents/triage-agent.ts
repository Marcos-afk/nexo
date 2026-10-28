import { Agent } from "@mastra/core/agent";
import type { MastraModelConfig } from "@mastra/core/llm";
import { triageSchema } from "../../domain/triage";
import { createErrorProcessors, MODEL_MAX_RETRIES } from "../model-call";
import { models } from "../models";

const TRIAGE_INSTRUCTIONS = [
  "Você faz a triagem de mensagens de funcionários para o service desk de TI da Nexo.",
  "Você NÃO responde ao funcionário. Você só classifica a mensagem mais recente, usando o histórico apenas como contexto.",
  "Todos os textos livres (understood e rationale) devem estar em português do Brasil, curtos e objetivos.",
  "Intenções: how_to (dúvida técnica ou problema que a central de ajuda pode resolver), ticket_lookup (consultar chamados existentes), ticket_create (pedir para abrir chamado ou relatar problema que exige atendimento), human_request (pede explicitamente um analista ou atendente), out_of_scope (assunto que não é de TI, como RH, financeiro ou facilities), chitchat (cumprimento ou agradecimento), unclear (não dá para saber o que a pessoa quer).",
  "Sinais: marque apenas os que se aplicam. asks_for_human (pede pessoa), urgent (urgência pessoal, como prazo no mesmo dia), critical_impact (algo está parado para uma equipe inteira ou para a empresa; NÃO marque quando afeta só uma pessoa), ambiguous (admite mais de uma leitura), missing_details (falta informação essencial), mentions_ticket_number (cita número de chamado), non_it_topic (fora de TI).",
  "confidence é um inteiro de 0 a 100 com a sua segurança de que a intenção escolhida está certa. 90 a 100: mensagem clara e sem outra leitura razoável. 60 a 89: provável, mas com alguma dúvida. 30 a 59: ambígua ou com pouca informação. 0 a 29: praticamente um palpite. Não use 100 por hábito.",
].join("\n");

export const createTriageAgent = (model: MastraModelConfig = models.triage) =>
  new Agent({
    id: "triage-agent",
    name: "Nexo Triagem",
    instructions: TRIAGE_INSTRUCTIONS,
    model,
    maxRetries: MODEL_MAX_RETRIES,
    errorProcessors: createErrorProcessors(),
    defaultOptions: { structuredOutput: { schema: triageSchema } },
  });

export const triageAgent = createTriageAgent();
