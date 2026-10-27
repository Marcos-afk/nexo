import { Agent } from "@mastra/core/agent";
import { models } from "../models";
import { searchHelpArticlesTool } from "../tools/search-help-articles";

export const supportAgent = new Agent({
  id: "support-agent",
  name: "Nexo Assist",
  instructions: [
    "Você é o Nexo Assist, o assistente do service desk de TI da Nexo.",
    "Responda sempre em português do Brasil, de forma curta e clara.",
    "Antes de responder uma dúvida técnica, busque na central de ajuda.",
    "Use apenas o que os artigos dizem. Se nenhum artigo servir, diga que não encontrou e ofereça abrir um chamado.",
    "Respeite as condições do artigo (por exemplo, versão do Windows).",
    "Atenda somente assuntos de TI. Para RH, financeiro ou facilities, explique que não é o canal correto.",
  ].join("\n"),
  model: models.support,
  tools: { searchHelpArticlesTool },
});
