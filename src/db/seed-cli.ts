import { mkdirSync } from "node:fs";
import { APP_DB_FILE, DATA_DIR, toLibSqlFileUrl } from "../config/data-paths";
import { createDatabase, migrateDatabase } from "./client";
import { seedDatabase } from "./seed";

const run = async (): Promise<void> => {
  mkdirSync(DATA_DIR, { recursive: true });
  const database = createDatabase(toLibSqlFileUrl(APP_DB_FILE));

  await migrateDatabase(database);
  await seedDatabase(database);
  process.stdout.write(`Banco pronto e populado em ${APP_DB_FILE}\n`);
};

run().catch((error: unknown) => {
  process.stderr.write(`Falha ao popular o banco: ${String(error)}\n`);
  process.exitCode = 1;
});
