import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readEmployeeId } from "../../request-context";
import {
  type AgentToolDeps,
  runTool,
  ticketDetailSchema,
  toTicketDetail,
  withFailure,
} from "./tool-support";

const NOT_FOUND_MESSAGE = "Não encontrei esse chamado entre os chamados do funcionário.";

export const createGetTicketTool = ({ tickets, clock }: AgentToolDeps) =>
  createTool({
    id: "getTicket",
    description:
      "Mostra os detalhes de um chamado pelo número (por exemplo INC-20311). Só encontra chamados do funcionário desta conversa; qualquer outro número volta como não encontrado.",
    inputSchema: z.object({ number: z.string().min(1).describe("Número do chamado") }),
    outputSchema: withFailure(z.object({ ticket: ticketDetailSchema })),
    execute: ({ number }, { requestContext }) =>
      runTool(async () => {
        const ticket = await tickets.get({ ownerId: readEmployeeId(requestContext), number });

        return ticket ? { ticket: toTicketDetail(ticket, clock) } : { error: NOT_FOUND_MESSAGE };
      }),
  });
