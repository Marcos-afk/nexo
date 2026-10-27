import { Mastra } from "@mastra/core/mastra";
import { supportAgent } from "./agents/support-agent";

export const mastra = new Mastra({
  agents: { supportAgent },
});
