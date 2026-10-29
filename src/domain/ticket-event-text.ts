import { z } from "zod";
import type { TicketEventKind } from "./ticket";

export interface TicketEventContext {
  readonly actorName: string | null;
  readonly payload: unknown;
}

const noteSchema = z.object({ note: z.string().min(1) });
const reasonSchema = z.object({ reason: z.string().min(1) });
const resolutionSchema = z.object({ resolution: z.string().min(1) });

const withDetail = (title: string, detail: string | undefined): string =>
  detail === undefined ? title : `${title}: ${detail}`;

const TEXT_BY_KIND: Readonly<Record<TicketEventKind, (context: TicketEventContext) => string>> = {
  created: () => "Chamado aberto",
  updated: ({ payload }) =>
    withDetail("Chamado atualizado", noteSchema.safeParse(payload).data?.note),
  reopened: () => "Chamado reaberto",
  transferred: ({ payload }) =>
    withDetail("Transferido ao suporte", reasonSchema.safeParse(payload).data?.reason),
  assumed: ({ actorName }) => `Assumido por ${actorName ?? "um analista"}`,
  resolved: ({ payload }) =>
    withDetail("Chamado resolvido", resolutionSchema.safeParse(payload).data?.resolution),
};

export const ticketEventText = (kind: TicketEventKind, context: TicketEventContext): string =>
  TEXT_BY_KIND[kind](context);
