import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { listTicketsByOwner, ticketPriorities, ticketStatuses } from "../../services/tickets/tickets";
import { readEmployeeId } from "../request-context";

export const listMyTicketsTool = createTool({
  id: "list-my-tickets",
  description:
    "Lista os chamados do funcionário que está conversando agora. Não recebe identificação de ninguém: o dono vem da sessão.",
  inputSchema: z.object({
    status: z.enum(ticketStatuses).optional().describe("Filtra por status do chamado"),
  }),
  outputSchema: z.object({
    tickets: z.array(
      z.object({
        number: z.string(),
        title: z.string(),
        status: z.enum(ticketStatuses),
        priority: z.enum(ticketPriorities),
      }),
    ),
  }),
  execute: async ({ status }, { requestContext }) => {
    const ownerId = readEmployeeId(requestContext);

    return {
      tickets: listTicketsByOwner(ownerId, status).map(({ number, title, status, priority }) => ({
        number,
        title,
        status,
        priority,
      })),
    };
  },
});
