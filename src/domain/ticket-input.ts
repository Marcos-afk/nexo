import { z } from "zod";
import { ticketPriorities } from "./sla";
import { ticketTypes } from "./ticket";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

export const createTicketInputSchema = z.object({
  type: z.enum(ticketTypes),
  category: z.string().min(1),
  subcategory: z.string().min(1).nullable(),
  title: z.string().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().min(1).max(MAX_DESCRIPTION_LENGTH),
  priority: z.enum(ticketPriorities),
  affected: z.string().min(1).nullable(),
});

export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;
