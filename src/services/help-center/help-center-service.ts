import type { Database } from "../../db/client";
import { helpArticles } from "../../db/schema";
import { ArticleConditionsInvalidError } from "../../domain/errors";
import {
  type ArticleMatch,
  articleConditionsSchema,
  type HelpArticle,
  rankArticles,
  type SearchContext,
} from "../../domain/help-article";

export interface HelpCenterServiceDeps {
  readonly database: Database;
}

type StoredArticle = typeof helpArticles.$inferSelect;

const toHelpArticle = (row: StoredArticle): HelpArticle => {
  const parsed = articleConditionsSchema.safeParse(row.conditions ?? null);
  if (!parsed.success) {
    throw new ArticleConditionsInvalidError(row.id, { cause: parsed.error });
  }

  return { id: row.id, title: row.title, body: row.body, tags: row.tags, conditions: parsed.data };
};

export const searchArticles = async (
  { database }: HelpCenterServiceDeps,
  query: string,
  context: SearchContext = {},
  limit?: number,
): Promise<readonly ArticleMatch[]> => {
  const rows = await database.select().from(helpArticles);

  return rankArticles(rows.map(toHelpArticle), query, context, limit);
};

export const createHelpCenterService = (deps: HelpCenterServiceDeps) => ({
  search: (query: string, context?: SearchContext, limit?: number) =>
    searchArticles(deps, query, context, limit),
});

export type HelpCenterService = ReturnType<typeof createHelpCenterService>;
