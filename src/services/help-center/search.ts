import { helpArticles, type HelpArticle } from "./articles";

export interface ArticleMatch {
  readonly article: HelpArticle;
  readonly score: number;
}

const MIN_TOKEN_LENGTH = 3;

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const tokenize = (text: string): readonly string[] =>
  normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

const scoreArticle = (queryTokens: readonly string[], article: HelpArticle): number => {
  const haystack = normalize(`${article.title} ${article.tags.join(" ")} ${article.body}`);
  const hits = queryTokens.filter((token) => haystack.includes(token)).length;
  return queryTokens.length === 0 ? 0 : hits / queryTokens.length;
};

export const searchHelpArticles = (query: string, limit = 3): readonly ArticleMatch[] => {
  const queryTokens = tokenize(query);
  return helpArticles
    .map((article) => ({ article, score: scoreArticle(queryTokens, article) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
