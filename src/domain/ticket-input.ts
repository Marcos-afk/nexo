import { z } from "zod";
import { CRITICAL_NEEDS_WIDE_IMPACT_MESSAGE, isPriorityConsistent } from "./affected-scope";
import { ticketPriorities } from "./sla";
import { ticketTypes } from "./ticket";
import { ticketCategories } from "./ticket-category";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

export const createTicketInputSchema = z.object({
  type: z.enum(ticketTypes),
  category: z.enum(ticketCategories),
  subcategory: z.string().min(1).nullable(),
  title: z.string().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().min(1).max(MAX_DESCRIPTION_LENGTH),
  priority: z.enum(ticketPriorities),
  affected: z.string().min(1).nullable(),
});

export const newTicketInputSchema = createTicketInputSchema.refine(
  ({ priority, affected }) => isPriorityConsistent(priority, affected),
  { path: ["priority"], message: CRITICAL_NEEDS_WIDE_IMPACT_MESSAGE },
);

export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;
