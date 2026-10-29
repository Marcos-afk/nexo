import { createBuildDraftTool } from "./build-draft-tool";
import { createFindSimilarTicketsTool } from "./find-similar-tickets-tool";
import { createGetTicketTool } from "./get-ticket-tool";
import { createListMyTicketsTool } from "./list-my-tickets-tool";
import { createOfferChoicesTool } from "./offer-choices-tool";
import { createRequestHandoffTool } from "./request-handoff-tool";
import { createSearchHelpArticlesTool } from "./search-help-articles-tool";
import type { AgentToolDeps } from "./tool-support";

export type { AgentToolDeps } from "./tool-support";

export const createAgentTools = (deps: AgentToolDeps) => ({
  listMyTickets: createListMyTicketsTool(deps),
  getTicket: createGetTicketTool(deps),
  searchHelpArticles: createSearchHelpArticlesTool(deps),
  findSimilarTickets: createFindSimilarTicketsTool(deps),
  buildDraft: createBuildDraftTool(deps),
  requestHandoff: createRequestHandoffTool(deps),
  offerChoices: createOfferChoicesTool(),
});

export type AgentTools = ReturnType<typeof createAgentTools>;
