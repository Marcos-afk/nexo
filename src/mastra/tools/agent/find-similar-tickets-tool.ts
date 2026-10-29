import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ticketCategories } from "../../../domain/ticket-category";
import { readEmployeeId } from "../../request-context";
import {
  type AgentToolDeps,
  runTool,
  ticketSummarySchema,
  toTicketSummary,
  withFailure,
} from "./tool-support";

export const createFindSimilarTicketsTool = ({ tickets, clock }: AgentToolDeps) =>
  createTool({
    id: "findSimilarTickets",
    description: `Procura chamados do funcionário na mesma categoria antes de abrir um novo. A categoria é uma destas: ${ticketCategories.join(", ")}. 'open' são chamados ainda não resolvidos (atualize em vez de duplicar); 'recentlyResolved' foram resolvidos há até 7 dias e podem ser reabertos.`,
    inputSchema: z.object({
      category: z.enum(ticketCategories).describe("Categoria do problema, só uma da lista"),
    }),
    outputSchema: withFailure(
      z.object({
        open: z.array(ticketSummarySchema),
        recentlyResolved: z.array(ticketSummarySchema),
      }),
    ),
    execute: ({ category }, { requestContext }) =>
      runTool(async () => {
        const similar = await tickets.findSimilar(readEmployeeId(requestContext), category);

        return {
          open: similar.open.map((ticket) => toTicketSummary(ticket, clock)),
          recentlyResolved: similar.recentlyResolved.map((ticket) =>
            toTicketSummary(ticket, clock),
          ),
        };
      }),
  });
