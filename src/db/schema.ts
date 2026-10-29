import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  conversationModes,
  draftModes,
  draftStatuses,
  messageAuthorKinds,
} from "../domain/conversation";
import { analystLevels, availabilities, employeeRoles } from "../domain/employee";
import { ticketPriorities } from "../domain/sla";
import { ticketEventKinds, ticketStatuses, ticketTypes } from "../domain/ticket";

const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" });

export const employees = sqliteTable("employees", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  role: text("role", { enum: employeeRoles }).notNull(),
  level: text("level", { enum: analystLevels }),
  availability: text("availability", { enum: availabilities }),
  passwordChangedAt: timestamp("password_changed_at"),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id),
    remember: integer("remember", { mode: "boolean" }).notNull(),
    userMessageCount: integer("user_message_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [index("sessions_employee_idx").on(table.employeeId)],
);

export const helpArticles = sqliteTable("help_articles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tags: text("tags", { mode: "json" }).$type<readonly string[]>().notNull(),
  conditions: text("conditions", { mode: "json" }).$type<unknown>(),
});

export const tickets = sqliteTable(
  "tickets",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    type: text("type", { enum: ticketTypes }).notNull(),
    category: text("category").notNull(),
    subcategory: text("subcategory"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    priority: text("priority", { enum: ticketPriorities }).notNull(),
    status: text("status", { enum: ticketStatuses }).notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => employees.id),
    affected: text("affected"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    dueAt: timestamp("due_at").notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    uniqueIndex("tickets_number_idx").on(table.number),
    index("tickets_owner_status_idx").on(table.ownerId, table.status),
  ],
);

export const ticketEvents = sqliteTable(
  "ticket_events",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id),
    kind: text("kind", { enum: ticketEventKinds }).notNull(),
    actor: text("actor").notNull(),
    payload: text("payload", { mode: "json" }).$type<unknown>(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [index("ticket_events_ticket_idx").on(table.ticketId, table.createdAt)],
);

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id),
    mode: text("mode", { enum: conversationModes }).notNull(),
    assignedAnalystId: text("assigned_analyst_id").references(() => employees.id),
    handoffReason: text("handoff_reason"),
    handoffSummary: text("handoff_summary"),
    handoffLevel: text("handoff_level", { enum: analystLevels }),
    analystReadAt: timestamp("analyst_read_at"),
    contactDueAt: timestamp("contact_due_at"),
    ticketId: text("ticket_id").references(() => tickets.id),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("conversations_employee_idx").on(table.employeeId),
    index("conversations_mode_idx").on(table.mode, table.updatedAt),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id),
    authorKind: text("author_kind", { enum: messageAuthorKinds }).notNull(),
    authorId: text("author_id"),
    content: text("content").notNull(),
    parts: text("parts", { mode: "json" }).$type<unknown>(),
    createdAt: timestamp("created_at").notNull(),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
  },
  (table) => [index("messages_conversation_idx").on(table.conversationId, table.createdAt)],
);

export const drafts = sqliteTable(
  "drafts",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id),
    mode: text("mode", { enum: draftModes }).notNull(),
    targetTicketId: text("target_ticket_id").references(() => tickets.id),
    payload: text("payload", { mode: "json" }).$type<unknown>().notNull(),
    status: text("status", { enum: draftStatuses }).notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [index("drafts_conversation_status_idx").on(table.conversationId, table.status)],
);

export const decisions = sqliteTable(
  "decisions",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id),
    intent: text("intent").notNull(),
    understood: text("understood").notNull(),
    action: text("action").notNull(),
    confidence: integer("confidence").notNull(),
    rationale: text("rationale").notNull(),
    signals: text("signals", { mode: "json" }).$type<readonly string[]>().notNull(),
    toolCalls: text("tool_calls", { mode: "json" }).$type<unknown>(),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    latencyMs: integer("latency_ms"),
    model: text("model").notNull(),
  },
  (table) => [index("decisions_message_idx").on(table.messageId)],
);
