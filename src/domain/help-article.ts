import { z } from "zod";

export const windowsVersions = ["10", "11"] as const;

export type WindowsVersion = (typeof windowsVersions)[number];

export const articleConditionsSchema = z
  .object({ windowsVersions: z.array(z.enum(windowsVersions)).min(1).optional() })
  .nullable();

export type ArticleConditions = z.infer<typeof articleConditionsSchema>;

export interface HelpArticle {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly conditions?: ArticleConditions;
}

export interface SearchContext {
  readonly windowsVersion?: WindowsVersion;
}

export type ArticleApplicability = "applies" | "not_applicable" | "needs_windows_version";

export interface ArticleMatch {
  readonly article: HelpArticle;
  readonly score: number;
  readonly applicability: ArticleApplicability;
}

const MIN_TOKEN_LENGTH = 3;
const DEFAULT_RESULT_LIMIT = 3;

const normalize = (text: string): string => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const tokenize = (text: string): readonly string[] =>
  normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

const scoreArticle = (queryTokens: readonly string[], article: HelpArticle): number => {
  if (queryTokens.length === 0) {
    return 0;
  }
  const haystack = normalize(`${article.title} ${article.tags.join(" ")} ${article.body}`);
  const hits = queryTokens.filter((token) => haystack.includes(token)).length;

  return hits / queryTokens.length;
};

export const resolveApplicability = (
  conditions: ArticleConditions | undefined,
  context: SearchContext,
): ArticleApplicability => {
  const required = conditions?.windowsVersions;
  if (required === undefined) {
    return "applies";
  }
  if (context.windowsVersion === undefined) {
    return "needs_windows_version";
  }

  return required.includes(context.windowsVersion) ? "applies" : "not_applicable";
};

export const rankArticles = (
  articles: readonly HelpArticle[],
  query: string,
  context: SearchContext = {},
  limit: number = DEFAULT_RESULT_LIMIT,
): readonly ArticleMatch[] => {
  const queryTokens = tokenize(query);

  return articles
    .map((article) => ({
      article,
      score: scoreArticle(queryTokens, article),
      applicability: resolveApplicability(article.conditions, context),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
