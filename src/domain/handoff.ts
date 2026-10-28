import { z } from "zod";
import type { ConversationMode } from "./conversation";
import { handoffUrgencies } from "./sla";

export const handoffActions = ["transfer", "assume", "return", "close", "reply"] as const;

export type HandoffAction = (typeof handoffActions)[number];

const transitions = {
  agent: { transfer: "awaiting_analyst" },
  awaiting_analyst: { assume: "with_analyst", return: "agent" },
  with_analyst: { return: "agent", close: "closed", reply: "with_analyst" },
  closed: {},
} as const satisfies Record<ConversationMode, Partial<Record<HandoffAction, ConversationMode>>>;

export const nextConversationMode = (
  mode: ConversationMode,
  action: HandoffAction,
): ConversationMode | null => {
  const allowed: Partial<Record<HandoffAction, ConversationMode>> = transitions[mode];

  return allowed[action] ?? null;
};

export const handoffInputSchema = z.object({
  reason: z.string().min(1),
  summary: z.string().min(1),
  urgency: z.enum(handoffUrgencies),
  ticketNumber: z.string().min(1).optional(),
});

export type HandoffInput = z.infer<typeof handoffInputSchema>;

export const transferredMessage = "Transferida para o suporte · agent pausado";
export const returnedMessage = "Devolvida ao agent";
export const closedMessage = "Atendimento encerrado";
export const assumedMessage = (analystName: string): string =>
  `${analystName} assumiu · agent pausado`;
