import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { draftModes } from "../../../domain/conversation";
import { draftInputSchema } from "../../../domain/draft";
import { computeDueAt, formatOfficeDateTime } from "../../../domain/sla";
import { createTicketInputSchema } from "../../../domain/ticket-input";
import { readConversationId, readEmployeeId } from "../../request-context";
import { type AgentToolDeps, failureSchema, runTool, withFailure } from "./tool-support";

const INCOMPLETE_DRAFT_MESSAGE =
  "O rascunho está incompleto ou inválido. Revise os campos e tente de novo:";

const flatInputSchema = z.object({
  mode: z
    .enum(draftModes)
    .describe("create abre chamado, update acrescenta uma nota, reopen reabre"),
  ticket: createTicketInputSchema.optional().describe("Obrigatório quando mode é create"),
  ticketNumber: z.string().min(1).optional().describe("Obrigatório em update e reopen"),
  note: z.string().min(1).optional().describe("Obrigatório em update"),
});

const describeIssues = (error: z.ZodError): string =>
  `${INCOMPLETE_DRAFT_MESSAGE} ${error.issues.map((issue) => issue.path.join(".")).join(", ")}.`;

export const createBuildDraftTool = ({ drafts, clock }: AgentToolDeps) =>
  createTool({
    id: "buildDraft",
    description:
      "Monta o rascunho de um chamado para o funcionário revisar. Esta ferramenta NUNCA cria nem altera o chamado: ele só é criado quando o funcionário clica em Confirmar. Mostre o rascunho e peça a confirmação.",
    inputSchema: flatInputSchema,
    outputSchema: withFailure(
      z.object({
        draftId: z.string(),
        mode: z.enum(draftModes),
        status: z.literal("pending"),
        dueAt: z.string().nullable().describe("Horário de Brasília, já formatado"),
      }),
    ),
    execute: (input, { requestContext }) => {
      const parsed = draftInputSchema.safeParse(input);

      if (!parsed.success) {
        return Promise.resolve(failureSchema.parse({ error: describeIssues(parsed.error) }));
      }

      return runTool(async () => {
        const draft = await drafts.propose(
          readEmployeeId(requestContext),
          readConversationId(requestContext),
          parsed.data,
        );

        return {
          draftId: draft.id,
          mode: draft.mode,
          status: "pending" as const,
          dueAt:
            parsed.data.mode === "create"
              ? formatOfficeDateTime(computeDueAt(parsed.data.ticket.priority, clock.now()))
              : null,
        };
      });
    },
  });
