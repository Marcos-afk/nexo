import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { withFailure } from "./tool-support";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;
const MAX_OPTION_LENGTH = 40;

const optionsSchema = z
  .array(z.string().trim().min(1).max(MAX_OPTION_LENGTH))
  .min(MIN_OPTIONS)
  .max(MAX_OPTIONS);

export const createOfferChoicesTool = () =>
  createTool({
    id: "offerChoices",
    description:
      "Mostra ao funcionário botões de resposta rápida abaixo da sua mensagem. Cada botão envia o próprio texto como resposta dele. Use sempre junto com um texto curto na resposta.",
    inputSchema: z.object({
      options: optionsSchema.describe("Textos curtos dos botões, na ordem em que aparecem"),
    }),
    outputSchema: withFailure(z.object({ options: optionsSchema })),
    execute: ({ options }) => Promise.resolve({ options }),
  });
