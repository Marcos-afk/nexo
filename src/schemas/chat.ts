import { z } from "zod";
import { conversationModes } from "@/domain/conversation";
import { ticketDetailSchema, ticketSummarySchema } from "@/domain/ticket-view";

export const buildDraftOutputSchema = z.object({ draftId: z.string() });

export const listTicketsOutputSchema = z.object({ tickets: z.array(ticketSummarySchema) });

export const getTicketOutputSchema = z.object({ ticket: ticketDetailSchema });

export const offerChoicesOutputSchema = z.object({ options: z.array(z.string().min(1)).min(2) });

export const handoffResponseSchema = z.object({ mode: z.enum(conversationModes) });
