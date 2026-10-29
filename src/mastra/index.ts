import { Mastra } from "@mastra/core/mastra";
import { triageAgent } from "./agents/triage-agent";
import { observability } from "./observability";
import { storage } from "./storage";

export const mastra = new Mastra({
  agents: { triageAgent },
  storage,
  observability,
});
