import { z } from "zod";
import { draftModes, draftStatuses } from "@/domain/conversation";
import { ticketPriorities } from "@/domain/sla";
import { ticketCategories } from "@/domain/ticket-category";
import { createTicketInputSchema } from "@/domain/ticket-input";
import type {
  ConfirmDraftResponseProps,
  DraftEditValues,
  DraftResponseProps,
  DraftStatusResponseProps,
} from "@/models/draft";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

export const EMPTY_TITLE_MESSAGE = "Informe um título.";
export const EMPTY_DESCRIPTION_MESSAGE = "Descreva o problema.";
export const LONG_TITLE_MESSAGE = `O título pode ter até ${MAX_TITLE_LENGTH} caracteres.`;
export const LONG_DESCRIPTION_MESSAGE = `A descrição pode ter até ${MAX_DESCRIPTION_LENGTH} caracteres.`;

const draftStatusSchema = z.object({ id: z.string(), status: z.enum(draftStatuses) });

export const draftResponseSchema = z.object({
  draft: z.object({
    id: z.string(),
    mode: z.enum(draftModes),
    status: z.enum(draftStatuses),
    targetTicketNumber: z.string().nullable(),
    ticket: createTicketInputSchema.nullable(),
    note: z.string().nullable(),
    dueAt: z.string().nullable(),
  }),
}) satisfies z.ZodType<DraftResponseProps>;

export const draftStatusResponseSchema = z.object({
  draft: draftStatusSchema,
}) satisfies z.ZodType<DraftStatusResponseProps>;

export const confirmDraftResponseSchema = z.object({
  draft: draftStatusSchema,
  ticket: z.object({ number: z.string(), title: z.string() }),
}) satisfies z.ZodType<ConfirmDraftResponseProps>;

export const draftEditSchema = z.object({
  title: z.string().trim().min(1, EMPTY_TITLE_MESSAGE).max(MAX_TITLE_LENGTH, LONG_TITLE_MESSAGE),
  description: z
    .string()
    .trim()
    .min(1, EMPTY_DESCRIPTION_MESSAGE)
    .max(MAX_DESCRIPTION_LENGTH, LONG_DESCRIPTION_MESSAGE),
  category: z.enum(ticketCategories),
  priority: z.enum(ticketPriorities),
  affected: z.string().trim(),
}) satisfies z.ZodType<DraftEditValues>;
