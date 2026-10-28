import { mkdirSync } from "node:fs";
import { LibSQLStore } from "@mastra/libsql";
import { DATA_DIR, MASTRA_DB_FILE, toLibSqlFileUrl } from "../config/data-paths";

const STORAGE_ID = "nexo-storage";

mkdirSync(DATA_DIR, { recursive: true });

export const storage = new LibSQLStore({ id: STORAGE_ID, url: toLibSqlFileUrl(MASTRA_DB_FILE) });
