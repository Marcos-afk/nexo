import { z } from "zod";
import { analystAvailabilities, consoleFilters } from "@/domain/console";
import { conversationModes, messageAuthorKinds } from "@/domain/conversation";
import { analystLevels } from "@/domain/employee";
import type { ConsoleProps } from "@/models/console";

const MAX_QUERY_LENGTH = 100;

export const consoleQuerySchema = z.object({
  filter: z.enum(consoleFilters).default("all"),
  q: z.string().trim().max(MAX_QUERY_LENGTH).default(""),
});

export const availabilityBodySchema = z.object({ availability: z.enum(analystAvailabilities) });

const labelSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("transferred"),
    ticketNumber: z.string().nullable(),
    contactDueAt: z.string().nullable(),
  }),
  z.object({ kind: z.literal("agent_asked_help"), confidence: z.number() }),
  z.object({ kind: z.literal("agent_active") }),
  z.object({ kind: z.literal("resolved_by_agent") }),
  z.object({ kind: z.literal("closed") }),
  z.object({ kind: z.literal("mine") }),
  z.object({ kind: z.literal("with_other"), analystName: z.string() }),
]);

const itemSchema = z.object({
  id: z.string(),
  employee: z.object({ id: z.string(), name: z.string(), department: z.string() }),
  mode: z.enum(conversationModes),
  ticketNumber: z.string().nullable(),
  updatedAt: z.string(),
  preview: z
    .object({ text: z.string(), authorKind: z.enum(messageAuthorKinds), at: z.string() })
    .nullable(),
  unread: z.number(),
  label: labelSchema,
});

export const consoleResponseSchema = z.object({
  me: z.object({
    id: z.string(),
    name: z.string(),
    level: z.enum(analystLevels).nullable(),
    availability: z.enum(analystAvailabilities),
  }),
  items: z.array(itemSchema),
  counts: z.object({
    all: z.number(),
    forYou: z.number(),
    withAgent: z.number(),
    mine: z.number(),
  }),
  attention: z.number(),
}) satisfies z.ZodType<ConsoleProps>;

export const availabilityResponseSchema = z.object({
  availability: z.enum(analystAvailabilities),
});
