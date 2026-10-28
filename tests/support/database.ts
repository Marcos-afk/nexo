import { createDatabase, migrateDatabase } from "../../src/db/client";
import { seedDatabase } from "../../src/db/seed";

const IN_MEMORY_URL = ":memory:";

export const createSeededDatabase = async () => {
  const database = createDatabase(IN_MEMORY_URL);
  await migrateDatabase(database);
  await seedDatabase(database);

  return database;
};
