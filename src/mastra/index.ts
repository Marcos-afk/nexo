import { Mastra } from "@mastra/core/mastra";
import { supportAgent } from "./agents/support-agent";
import { triageAgent } from "./agents/triage-agent";
import { observability } from "./observability";
import { storage } from "./storage";

export const mastra = new Mastra({
  agents: { supportAgent, triageAgent },
  storage,
  observability,
});
