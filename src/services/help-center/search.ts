import { type ArticleMatch, rankArticles } from "../../domain/help-article";
import { helpArticles } from "./articles";

export const searchHelpArticles = (query: string, limit?: number): readonly ArticleMatch[] =>
  rankArticles(helpArticles, query, {}, limit);
