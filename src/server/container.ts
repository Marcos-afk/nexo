import { mkdirSync } from "node:fs";
import { APP_DB_FILE, DATA_DIR, toLibSqlFileUrl } from "../config/data-paths";
import { createDatabase, migrateDatabase } from "../db/client";
import { systemClock } from "../lib/clock";
import { uuidGenerator } from "../lib/ids";
import type { ConversationServiceDeps } from "../services/conversations/conversation-service";

const DEPS_CACHE_KEY = "service-deps";

interface CachedDeps {
  readonly deps: Promise<ConversationServiceDeps>;
}

const cache = new Map<string, CachedDeps>();

const createServiceDeps = async (): Promise<ConversationServiceDeps> => {
  mkdirSync(DATA_DIR, { recursive: true });
  const database = createDatabase(toLibSqlFileUrl(APP_DB_FILE));

  await migrateDatabase(database);

  return { database, clock: systemClock, ids: uuidGenerator };
};

export const getServiceDeps = (): Promise<ConversationServiceDeps> => {
  const existing = cache.get(DEPS_CACHE_KEY);

  if (existing) {
    return existing.deps;
  }

  const created = { deps: createServiceDeps() };
  cache.set(DEPS_CACHE_KEY, created);

  return created.deps;
};
