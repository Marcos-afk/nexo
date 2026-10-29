import { sql } from "drizzle-orm";
import { z } from "zod";
import { DatabaseResetBlockedError } from "../domain/errors";
import type { Database } from "./client";

const tableRowsSchema = z.array(z.object({ name: z.string().min(1) }));

const quoteIdentifier = (name: string): string => `"${name.replaceAll('"', '""')}"`;

export const assertResettable = (nodeEnv: string): void => {
  if (nodeEnv === "production") {
    throw new DatabaseResetBlockedError();
  }
};

export const resetDatabase = async (database: Database): Promise<void> => {
  const rows = tableRowsSchema.parse(
    await database.all(
      sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%'`,
    ),
  );
  const drops = rows.map(({ name }) => `drop table if exists ${quoteIdentifier(name)};`);

  await database.$client.executeMultiple(
    ["pragma foreign_keys = off;", ...drops, "pragma foreign_keys = on;"].join("\n"),
  );
};
