import { z } from "zod";
import { createTicketInputSchema } from "./ticket-input";

const MAX_NOTE_LENGTH = 2000;

const noteSchema = z.string().min(1).max(MAX_NOTE_LENGTH);
const ticketNumberSchema = z.string().min(1);

export const draftInputSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("create"), ticket: createTicketInputSchema }),
  z.object({ mode: z.literal("update"), ticketNumber: ticketNumberSchema, note: noteSchema }),
  z.object({ mode: z.literal("reopen"), ticketNumber: ticketNumberSchema }),
]);

export type DraftInput = z.infer<typeof draftInputSchema>;

export const storedDraftSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("create"), payload: createTicketInputSchema }),
  z.object({ mode: z.literal("update"), payload: z.object({ note: noteSchema }) }),
  z.object({ mode: z.literal("reopen"), payload: z.object({}) }),
]);

export type StoredDraft = z.infer<typeof storedDraftSchema>;

export const draftPayloadOf = (input: DraftInput): unknown => {
  switch (input.mode) {
    case "create":
      return input.ticket;
    case "update":
      return { note: input.note };
    case "reopen":
      return {};
  }
};
