import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { MIGRATIONS_DIR } from "../config/data-paths";
import * as schema from "./schema";

export const createDatabase = (url: string) => drizzle(createClient({ url }), { schema });

export type Database = ReturnType<typeof createDatabase>;

export const migrateDatabase = (database: Database): Promise<void> =>
  migrate(database, { migrationsFolder: MIGRATIONS_DIR });
