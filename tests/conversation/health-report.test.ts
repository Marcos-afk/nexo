import { describe, expect, it } from "vitest";
import { createHealthReporter } from "../../src/conversation/health-report";
import { createModelHealth } from "../../src/conversation/model-health";
import { ModelUnavailableError } from "../../src/domain/errors";
import { assistantStatusOf } from "../../src/domain/health";
import { createOutageSimulator } from "../../src/services/tickets/legacy-guard";
import { createFixedClock } from "../support/clock";

const NOW = "2026-10-28T10:00:00-03:00";
const MS_PER_SECOND = 1000;

const statusCases = [
  { model: "ok", tickets: "ok", expected: "online" },
  { model: "ok", tickets: "unavailable", expected: "degraded" },
  { model: "rate_limited", tickets: "ok", expected: "offline" },
  { model: "rate_limited", tickets: "unavailable", expected: "offline" },
  { model: "unavailable", tickets: "ok", expected: "offline" },
  { model: "unavailable", tickets: "unavailable", expected: "offline" },
] as const;

describe("assistantStatusOf", () => {
  it.each(statusCases)(
    "model $model with tickets $tickets is $expected",
    ({ model, tickets, expected }) => {
      expect(assistantStatusOf(model, tickets)).toBe(expected);
    },
  );
});

describe("createHealthReporter", () => {
  const setup = () => {
    const clock = createFixedClock(NOW);

    return {
      clock,
      modelHealth: createModelHealth(clock),
      outage: createOutageSimulator(clock),
    };
  };

  it("reports online when both dependencies work", () => {
    const { clock, modelHealth, outage } = setup();
    const report = createHealthReporter({ modelHealth, ticketSystem: outage, clock })();

    expect(report).toEqual({
      status: "online",
      model: "ok",
      tickets: "ok",
      checkedAt: new Date(NOW).toISOString(),
    });
  });

  it("reports degraded while the ticket system is down", () => {
    const { clock, modelHealth, outage } = setup();
    outage.startFor(60 * MS_PER_SECOND);

    expect(createHealthReporter({ modelHealth, ticketSystem: outage, clock })()).toMatchObject({
      status: "degraded",
      tickets: "unavailable",
    });
  });

  it("reports offline when the model failed, even if the ticket system is also down", () => {
    const { clock, modelHealth, outage } = setup();
    modelHealth.markFailure(new ModelUnavailableError());
    outage.startFor(60 * MS_PER_SECOND);

    expect(createHealthReporter({ modelHealth, ticketSystem: outage, clock })()).toMatchObject({
      status: "offline",
      model: "unavailable",
      tickets: "unavailable",
    });
  });
});

describe("OutageSimulator.isDown", () => {
  it("is down only inside the outage window", () => {
    const time = { nowMs: Date.parse(NOW) };
    const outage = createOutageSimulator({ now: () => new Date(time.nowMs) });
    outage.startFor(30 * MS_PER_SECOND);
    const inside = outage.isDown();

    time.nowMs += 31 * MS_PER_SECOND;

    expect([inside, outage.isDown()]).toEqual([true, false]);
  });
});
