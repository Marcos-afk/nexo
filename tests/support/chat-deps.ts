import type { MastraModelConfig } from "@mastra/core/llm";
import type { ChatOrchestratorDeps } from "../../src/conversation/chat-orchestrator";
import type { Database } from "../../src/db/client";
import { createTriageAgent } from "../../src/mastra/agents/triage-agent";
import { createDecisionService } from "../../src/services/decisions/decision-service";
import { createDraftService } from "../../src/services/drafts/draft-service";
import { createHandoffService } from "../../src/services/handoff/handoff-service";
import { createHelpCenterService } from "../../src/services/help-center/help-center-service";
import { createTicketService } from "../../src/services/tickets/ticket-service";
import { createFixedClock } from "./clock";
import { createSeededDatabase } from "./database";
import { createSequentialIds } from "./ids";

const NOW = "2026-10-28T10:00:00-03:00";

export interface ChatDepsModels {
  readonly triage: MastraModelConfig;
  readonly support?: MastraModelConfig;
  readonly database?: Database;
}

export const createChatDeps = async ({
  triage,
  support,
  database: existing,
}: ChatDepsModels): Promise<ChatOrchestratorDeps> => {
  const database = existing ?? (await createSeededDatabase());
  const clock = createFixedClock(NOW);
  const ids = createSequentialIds("chat");
  const conversations = { database, clock, ids };

  return {
    conversations,
    clock,
    triageAgent: createTriageAgent(triage),
    tickets: createTicketService(conversations),
    drafts: createDraftService(conversations),
    handoff: createHandoffService(conversations),
    helpCenter: createHelpCenterService({ database }),
    decisions: createDecisionService({ database, ids }),
    ...(support ? { supportModel: support } : {}),
  };
};
