import { assistantStatusOf, type HealthReport } from "../domain/health";
import type { Clock } from "../lib/clock";
import type { ModelHealth } from "./model-health";

export interface HealthReportDeps {
  readonly modelHealth: ModelHealth;
  readonly ticketSystem: { readonly isDown: () => boolean };
  readonly clock: Clock;
}

export const createHealthReporter =
  ({ modelHealth, ticketSystem, clock }: HealthReportDeps) =>
  (): HealthReport => {
    const model = modelHealth.state();
    const tickets = ticketSystem.isDown() ? "unavailable" : "ok";

    return {
      status: assistantStatusOf(model, tickets),
      model,
      tickets,
      checkedAt: clock.now().toISOString(),
    };
  };

export type HealthReporter = ReturnType<typeof createHealthReporter>;
