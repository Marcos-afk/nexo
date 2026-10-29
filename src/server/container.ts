import { mkdirSync } from "node:fs";
import { APP_DB_FILE, DATA_DIR, toLibSqlFileUrl } from "../config/data-paths";
import type { ChatOrchestratorDeps } from "../conversation/chat-orchestrator";
import { createHealthReporter, type HealthReporter } from "../conversation/health-report";
import { createModelHealth } from "../conversation/model-health";
import { createDatabase, migrateDatabase } from "../db/client";
import type { RealtimeEvent } from "../domain/realtime";
import { env } from "../env";
import { systemClock } from "../lib/clock";
import { createEventBus, type EventBus } from "../lib/event-bus";
import { uuidGenerator } from "../lib/ids";
import { createLogger, stdoutWrite } from "../lib/logger";
import { triageAgent } from "../mastra/agents/triage-agent";
import { type AuthService, createAuthService } from "../services/auth/auth-service";
import type { ConversationServiceDeps } from "../services/conversations/conversation-service";
import { createDecisionService } from "../services/decisions/decision-service";
import { createDraftService } from "../services/drafts/draft-service";
import { createHandoffService } from "../services/handoff/handoff-service";
import { createHelpCenterService } from "../services/help-center/help-center-service";
import { createStatsService, type StatsService } from "../services/stats/stats-service";
import { createLegacyGuard, createOutageSimulator } from "../services/tickets/legacy-guard";
import { createTicketService } from "../services/tickets/ticket-service";

const DEPS_CACHE_KEY = "service-deps";
const MS_PER_SECOND = 1000;
const EVENT_BUFFER_CAPACITY = 200;

interface CachedDeps {
  readonly container: Promise<Container>;
}

const cache = new Map<string, CachedDeps>();

const createLegacy = () => {
  const outage = createOutageSimulator(systemClock);

  outage.startFor(env.LEGACY_OUTAGE_SECONDS * MS_PER_SECOND);

  const guard = createLegacyGuard({
    outage,
    logger: createLogger({ level: "info", clock: systemClock, write: stdoutWrite }),
  });

  return { guard, outage };
};

export interface Container {
  readonly chat: ChatOrchestratorDeps;
  readonly auth: AuthService;
  readonly stats: StatsService;
  readonly health: HealthReporter;
  readonly events: EventBus<RealtimeEvent>;
}

const createContainer = async (): Promise<Container> => {
  mkdirSync(DATA_DIR, { recursive: true });
  const database = createDatabase(toLibSqlFileUrl(APP_DB_FILE));

  await migrateDatabase(database);

  const events = createEventBus<RealtimeEvent>(EVENT_BUFFER_CAPACITY);
  const conversations: ConversationServiceDeps = {
    database,
    clock: systemClock,
    ids: uuidGenerator,
    events: { publish: (event) => void events.publish(event) },
  };
  const { guard: legacy, outage } = createLegacy();
  const modelHealth = createModelHealth(systemClock);
  const ticketDeps = { ...conversations, legacy };

  const chat: ChatOrchestratorDeps = {
    conversations,
    clock: systemClock,
    modelHealth,
    triageAgent,
    tickets: createTicketService(ticketDeps),
    drafts: createDraftService(ticketDeps),
    handoff: createHandoffService(ticketDeps),
    helpCenter: createHelpCenterService({ database }),
    decisions: createDecisionService({ database, ids: uuidGenerator }),
  };

  return {
    chat,
    auth: createAuthService(conversations),
    stats: createStatsService({ database, clock: systemClock }),
    health: createHealthReporter({ modelHealth, ticketSystem: outage, clock: systemClock }),
    events,
  };
};

export const getContainer = (): Promise<Container> => {
  const existing = cache.get(DEPS_CACHE_KEY);

  if (existing) {
    return existing.container;
  }

  const created = { container: createContainer() };
  cache.set(DEPS_CACHE_KEY, created);

  return created.container;
};
