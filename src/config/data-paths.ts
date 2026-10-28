import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const CONVERSATIONS_FILE = path.join(DATA_DIR, "conversations.json");
export const MASTRA_DB_FILE = path.join(DATA_DIR, "mastra.db");
export const APP_DB_FILE = path.join(DATA_DIR, "nexo.db");
export const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");

export const toLibSqlFileUrl = (filePath: string): string =>
  `file:${filePath.replaceAll("\\", "/")}`;
