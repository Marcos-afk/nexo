import { z } from "zod";
import { ticketPriorities } from "./sla";
import { ticketTypes } from "./ticket";

export const ticketSummarySchema = z.object({
  number: z.string(),
  title: z.string(),
  category: z.string(),
  status: z
    .string()
    .describe("Situação do chamado em português, como deve ser dita ao funcionário"),
  priority: z.enum(ticketPriorities),
  dueAt: z.string().describe("Horário de Brasília, já formatado"),
  overdue: z.boolean(),
  updatedAt: z.string().describe("Horário de Brasília, já formatado"),
});

export const ticketDetailSchema = ticketSummarySchema.extend({
  type: z.enum(ticketTypes),
  subcategory: z.string().nullable(),
  description: z.string(),
  affected: z.string().nullable(),
  createdAt: z.string().describe("Horário de Brasília, já formatado"),
  resolvedAt: z.string().nullable().describe("Horário de Brasília, já formatado"),
  reopenable: z.boolean(),
});

export type TicketSummaryView = z.infer<typeof ticketSummarySchema>;
export type TicketDetailView = z.infer<typeof ticketDetailSchema>;
