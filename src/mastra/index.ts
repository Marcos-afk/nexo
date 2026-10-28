import { Mastra } from "@mastra/core/mastra";
import { supportAgent } from "./agents/support-agent";
import { storage } from "./storage";

export const mastra = new Mastra({
  agents: { supportAgent },
  storage,
});
