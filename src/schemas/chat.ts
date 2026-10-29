import { z } from "zod";
import { ticketDetailSchema, ticketSummarySchema } from "@/domain/ticket-view";

export const buildDraftOutputSchema = z.object({ draftId: z.string() });

export const listTicketsOutputSchema = z.object({ tickets: z.array(ticketSummarySchema) });

export const getTicketOutputSchema = z.object({ ticket: ticketDetailSchema });
