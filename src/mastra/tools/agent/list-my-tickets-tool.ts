import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { TicketStatus } from "../../../domain/ticket";
import { isClosed } from "../../../domain/ticket-rules";
import { readEmployeeId } from "../../request-context";
import {
  type AgentToolDeps,
  runTool,
  ticketSummarySchema,
  toTicketSummary,
  withFailure,
} from "./tool-support";

export const ticketScopes = ["unresolved", "resolved", "all"] as const;

const DEFAULT_SCOPE = "unresolved";

type TicketScope = (typeof ticketScopes)[number];

const statusMatchByScope = {
  unresolved: (status) => !isClosed(status),
  resolved: isClosed,
  all: () => true,
} as const satisfies Record<TicketScope, (status: TicketStatus) => boolean>;

export const matchesScope = (status: TicketStatus, scope: TicketScope): boolean =>
  statusMatchByScope[scope](status);

export const createListMyTicketsTool = ({ tickets, clock }: AgentToolDeps) =>
  createTool({
    id: "listMyTickets",
    description:
      "Lista os chamados do funcionário desta conversa. Por padrão traz só os não resolvidos, que é o que 'chamados em aberto' significa no dia a dia. Não recebe identificação de ninguém: o dono vem da sessão.",
    inputSchema: z.object({
      scope: z
        .enum(ticketScopes)
        .default(DEFAULT_SCOPE)
        .describe("unresolved (padrão), resolved ou all"),
    }),
    outputSchema: withFailure(z.object({ tickets: z.array(ticketSummarySchema) })),
    execute: ({ scope }, { requestContext }) =>
      runTool(async () => {
        const found = await tickets.list(readEmployeeId(requestContext));

        return {
          tickets: found
            .filter((ticket) => matchesScope(ticket.status, scope))
            .map((ticket) => toTicketSummary(ticket, clock)),
        };
      }),
  });
