import { mkdirSync } from "node:fs";
import { APP_DB_FILE, DATA_DIR, toLibSqlFileUrl } from "../config/data-paths";
import type { ChatOrchestratorDeps } from "../conversation/chat-orchestrator";
import { createHealthReporter, type HealthReporter } from "../conversation/health-report";
import { createModelHealth, type ModelHealth } from "../conversation/model-health";
import { createDatabase, migrateDatabase } from "../db/client";
import type { EventPublisher, RealtimeEvent } from "../domain/realtime";
import { env } from "../env";
import { systemClock } from "../lib/clock";
import { createEventBus, type EventBus } from "../lib/event-bus";
import { uuidGenerator } from "../lib/ids";
import { createLogger, type Logger, stdoutWrite } from "../lib/logger";
import { triageAgent } from "../mastra/agents/triage-agent";
import { type AuthService, createAuthService } from "../services/auth/auth-service";
import { type ConsoleService, createConsoleService } from "../services/console/console-service";
import type { ConversationServiceDeps } from "../services/conversations/conversation-service";
import { createDecisionService } from "../services/decisions/decision-service";
import { createDraftService } from "../services/drafts/draft-service";
import { createHandoffService } from "../services/handoff/handoff-service";
import { createHelpCenterService } from "../services/help-center/help-center-service";
import { createStatsService, type StatsService } from "../services/stats/stats-service";
import {
  createLegacyGuard,
  createOutageSimulator,
  type LegacyGuard,
} from "../services/tickets/legacy-guard";
import { createTicketService } from "../services/tickets/ticket-service";
import { createPresenceTracker, type PresenceTracker } from "./presence";

const DEPS_CACHE_KEY = "service-deps";
const MS_PER_SECOND = 1000;
const EVENT_BUFFER_CAPACITY = 200;

interface CachedDeps {
  readonly container: Promise<Container>;
}

const cache = new Map<string, CachedDeps>();

const createLegacy = (logger: Logger) => {
  const outage = createOutageSimulator(systemClock);

  outage.startFor(env.LEGACY_OUTAGE_SECONDS * MS_PER_SECOND);

  const guard = createLegacyGuard({ outage, logger });

  return { guard, outage };
};

export interface Container {
  readonly chat: ChatOrchestratorDeps;
  readonly auth: AuthService;
  readonly stats: StatsService;
  readonly console: ConsoleService;
  readonly presence: PresenceTracker;
  readonly health: HealthReporter;
  readonly events: EventBus<RealtimeEvent>;
}

const createChatDeps = (
  conversations: ConversationServiceDeps,
  legacy: LegacyGuard,
  modelHealth: ModelHealth,
): ChatOrchestratorDeps => {
  const { database } = conversations;
  const ticketDeps = { ...conversations, legacy };

  return {
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
};

const createContainer = async (): Promise<Container> => {
  mkdirSync(DATA_DIR, { recursive: true });
  const database = createDatabase(toLibSqlFileUrl(APP_DB_FILE));

  await migrateDatabase(database);

  const events = createEventBus<RealtimeEvent>(EVENT_BUFFER_CAPACITY);
  const publisher: EventPublisher = { publish: (event) => void events.publish(event) };
  const conversations: ConversationServiceDeps = {
    database,
    clock: systemClock,
    ids: uuidGenerator,
    events: publisher,
  };
  const presence = createPresenceTracker({ events: publisher, clock: systemClock });
  const logger = createLogger({ level: "info", clock: systemClock, write: stdoutWrite });
  const { guard: legacy, outage } = createLegacy(logger);
  const modelHealth = createModelHealth(systemClock);
  const chat = createChatDeps(conversations, legacy, modelHealth);

  return {
    chat,
    auth: createAuthService({ ...conversations, logger }),
    stats: createStatsService({ database, clock: systemClock }),
    console: createConsoleService({ ...conversations, presence }),
    presence,
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
