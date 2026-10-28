import type { Database } from "../client";
import {
  conversations,
  decisions,
  drafts,
  employees,
  helpArticles,
  messages,
  ticketEvents,
  tickets,
} from "../schema";
import { seedArticles } from "./articles";
import { seedConversations, seedDecisions, seedDrafts, seedMessages } from "./conversations";
import { seedEmployees } from "./employees";
import { seedTicketEvents, seedTickets } from "./tickets";

const seedPeopleAndArticles = async (database: Database): Promise<void> => {
  await database
    .insert(employees)
    .values([...seedEmployees])
    .onConflictDoNothing();
  await database
    .insert(helpArticles)
    .values([...seedArticles])
    .onConflictDoNothing();
};

const seedTicketData = async (database: Database): Promise<void> => {
  await database
    .insert(tickets)
    .values([...seedTickets])
    .onConflictDoNothing();
  await database
    .insert(ticketEvents)
    .values([...seedTicketEvents])
    .onConflictDoNothing();
};

const seedConversationData = async (database: Database): Promise<void> => {
  await database
    .insert(conversations)
    .values([...seedConversations])
    .onConflictDoNothing();
  await database
    .insert(messages)
    .values([...seedMessages])
    .onConflictDoNothing();
  await database
    .insert(drafts)
    .values([...seedDrafts])
    .onConflictDoNothing();
  await database
    .insert(decisions)
    .values([...seedDecisions])
    .onConflictDoNothing();
};

export const seedDatabase = async (database: Database): Promise<void> => {
  await seedPeopleAndArticles(database);
  await seedTicketData(database);
  await seedConversationData(database);
};
