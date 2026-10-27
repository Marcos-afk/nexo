import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { searchHelpArticles } from "../../services/help-center/search";

export const searchHelpArticlesTool = createTool({
  id: "search-help-articles",
  description:
    "Busca artigos da central de ajuda de TI. Use antes de abrir chamado para ver se a dúvida já tem resposta.",
  inputSchema: z.object({
    query: z.string().min(2).describe("Palavras-chave do problema relatado pelo funcionário"),
  }),
  outputSchema: z.object({
    articles: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        score: z.number(),
      }),
    ),
  }),
  execute: async ({ query }) => ({
    articles: searchHelpArticles(query).map(({ article, score }) => ({
      id: article.id,
      title: article.title,
      body: article.body,
      score,
    })),
  }),
});
