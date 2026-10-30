import { z } from "zod";
import { analystAvailabilities, consoleFilters } from "@/domain/console";
import { conversationModes, messageAuthorKinds } from "@/domain/conversation";
import { analystLevels } from "@/domain/employee";
import { MAX_ANALYST_REPLY_LENGTH } from "@/domain/input-limits";
import { ticketPriorities } from "@/domain/sla";
import { ticketEventKinds, ticketStatuses, ticketTypes } from "@/domain/ticket";
import type {
  ConsoleConversationProps,
  ConsoleProps,
  ConsoleTicketDetailProps,
  ConversationTicketsProps,
} from "@/models/console";

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
  z.object({
    kind: z.literal("agent_asked_help"),
    confidence: z.number(),
    decisionMessageId: z.string(),
  }),
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

const MAX_REPLY_LENGTH = MAX_ANALYST_REPLY_LENGTH;

export const EMPTY_REPLY_MESSAGE = "Escreva a resposta antes de enviar.";
export const LONG_REPLY_MESSAGE = `A resposta pode ter até ${MAX_REPLY_LENGTH} caracteres.`;

export const replyBodySchema = z.object({
  content: z.string().trim().min(1, EMPTY_REPLY_MESSAGE).max(MAX_REPLY_LENGTH, LONG_REPLY_MESSAGE),
});

export const conversationResponseSchema = z.object({
  conversation: z.object({
    id: z.string(),
    viewerId: z.string(),
    employee: z.object({ id: z.string(), name: z.string(), department: z.string() }),
    employeeOnline: z.boolean(),
    mode: z.enum(conversationModes),
    handoffLevel: z.enum(analystLevels).nullable(),
    handoffReason: z.string().nullable(),
    handoffSummary: z.string().nullable(),
    contactDueAt: z.string().nullable(),
    ticket: z
      .object({
        number: z.string(),
        title: z.string(),
        status: z.enum(ticketStatuses),
        priority: z.enum(ticketPriorities),
      })
      .nullable(),
    assignedAnalyst: z
      .object({ id: z.string(), name: z.string(), level: z.enum(analystLevels).nullable() })
      .nullable(),
    messages: z.array(
      z.object({
        id: z.string(),
        authorKind: z.enum(messageAuthorKinds),
        authorName: z.string().nullable(),
        authorLevel: z.enum(analystLevels).nullable(),
        content: z.string(),
        createdAt: z.string(),
        readByEmployee: z.boolean().nullable(),
      }),
    ),
    usage: z.object({
      turns: z.number().int().nonnegative(),
      tokensIn: z.number().int().nonnegative(),
      tokensOut: z.number().int().nonnegative(),
      totalTokens: z.number().int().nonnegative(),
      averageLatencyMs: z.number().nullable(),
      maxLatencyMs: z.number().nullable(),
      models: z.array(z.object({ model: z.string(), turns: z.number().int().nonnegative() })),
    }),
  }),
}) satisfies z.ZodType<{ conversation: ConsoleConversationProps }>;

export const actionResponseSchema = z.looseObject({});

export const eventSignalSchema = z.object({ conversationId: z.string() });

export const messageEventSchema = z.object({
  conversationId: z.string(),
  authorKind: z.string(),
});

const ticketItemSchema = z.object({
  number: z.string(),
  title: z.string(),
  status: z.enum(ticketStatuses),
  priority: z.enum(ticketPriorities),
  dueAt: z.string(),
  updatedAt: z.string(),
  overdue: z.boolean(),
  isCurrent: z.boolean(),
  lastEvent: z.object({ text: z.string(), at: z.string() }).nullable(),
});

export const ticketsResponseSchema = z.object({
  tickets: z.object({
    employeeName: z.string(),
    open: z.number(),
    closed: z.number(),
    tickets: z.array(ticketItemSchema),
  }),
}) satisfies z.ZodType<{ tickets: ConversationTicketsProps }>;

export const ticketDetailResponseSchema = z.object({
  detail: z.object({
    ticket: z.object({
      number: z.string(),
      type: z.enum(ticketTypes),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      subcategory: z.string().nullable(),
      priority: z.enum(ticketPriorities),
      status: z.enum(ticketStatuses),
      affected: z.string().nullable(),
      dueAt: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      resolvedAt: z.string().nullable(),
    }),
    overdue: z.boolean(),
    events: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(ticketEventKinds),
        text: z.string(),
        at: z.string(),
      }),
    ),
  }),
}) satisfies z.ZodType<{ detail: ConsoleTicketDetailProps }>;
