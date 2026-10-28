import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  type ArticleMatch,
  type SearchContext,
  type WindowsVersion,
  windowsVersions,
} from "../../../domain/help-article";
import { type AgentToolDeps, runTool, withFailure } from "./tool-support";

const MIN_QUERY_LENGTH = 2;

const inputSchema = z.object({
  query: z.string().min(MIN_QUERY_LENGTH).describe("Palavras-chave do problema relatado"),
  windowsVersion: z
    .enum(windowsVersions)
    .optional()
    .describe("Versão do Windows, somente se o funcionário já informou"),
});

const outputSchema = withFailure(
  z.object({
    articles: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        applicability: z.enum(["applies", "not_applicable", "needs_windows_version"]),
      }),
    ),
  }),
);

const toSearchContext = (windowsVersion: WindowsVersion | undefined): SearchContext =>
  windowsVersion ? { windowsVersion } : {};

const toArticleDto = ({ article, applicability }: ArticleMatch) => ({
  id: article.id,
  title: article.title,
  body: article.body,
  applicability,
});

export const createSearchHelpArticlesTool = ({ helpCenter }: AgentToolDeps) =>
  createTool({
    id: "searchHelpArticles",
    description:
      "Busca artigos da central de ajuda de TI. Cada artigo traz 'applicability': 'applies' pode ser usado, 'not_applicable' não vale para a versão do Windows informada, 'needs_windows_version' exige perguntar a versão ao funcionário antes de usar o artigo.",
    inputSchema,
    outputSchema,
    execute: ({ query, windowsVersion }) =>
      runTool(async () => {
        const matches = await helpCenter.search(query, toSearchContext(windowsVersion));

        return { articles: matches.map(toArticleDto) };
      }),
  });
