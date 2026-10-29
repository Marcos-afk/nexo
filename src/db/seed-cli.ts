import { mkdirSync } from "node:fs";
import { APP_DB_FILE, DATA_DIR, toLibSqlFileUrl } from "../config/data-paths";
import { env } from "../env";
import { createDatabase, migrateDatabase } from "./client";
import { assertResettable, resetDatabase } from "./reset";
import { seedDatabase } from "./seed";

const run = async (): Promise<void> => {
  assertResettable(env.NODE_ENV);
  mkdirSync(DATA_DIR, { recursive: true });
  const database = createDatabase(toLibSqlFileUrl(APP_DB_FILE));

  await resetDatabase(database);
  await migrateDatabase(database);
  await seedDatabase(database);
  process.stdout.write(`Banco recriado e populado em ${APP_DB_FILE}\n`);
};

run().catch((error: unknown) => {
  process.stderr.write(`Falha ao recriar o banco: ${String(error)}\n`);
  process.exitCode = 1;
});
