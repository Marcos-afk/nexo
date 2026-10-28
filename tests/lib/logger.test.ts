import { describe, expect, it } from "vitest";
import { createLogger, type LogLevel } from "@/lib/logger";
import { createFixedClock } from "../support/clock";

const FIXED_TIME = "2026-10-28T12:00:00.000Z";

const buildLogger = (level: LogLevel) => {
  const lines: string[] = [];
  const logger = createLogger({
    level,
    clock: createFixedClock(FIXED_TIME),
    write: (line) => lines.push(line),
  });

  return { logger, lines };
};

describe("createLogger", () => {
  it("writes one structured JSON line with level, time and message", () => {
    const { logger, lines } = buildLogger("info");

    logger.info({ conversationId: "c-1" }, "conversation_started");

    expect(JSON.parse(lines[0] ?? "")).toEqual({
      level: "info",
      time: FIXED_TIME,
      message: "conversation_started",
      conversationId: "c-1",
    });
  });

  it.each([
    { configured: "debug", emitted: ["debug", "info", "warn", "error"] },
    { configured: "info", emitted: ["info", "warn", "error"] },
    { configured: "warn", emitted: ["warn", "error"] },
    { configured: "error", emitted: ["error"] },
  ] as const)("at level $configured emits $emitted", ({ configured, emitted }) => {
    const { logger, lines } = buildLogger(configured);

    logger.debug({}, "m");
    logger.info({}, "m");
    logger.warn({}, "m");
    logger.error({}, "m");

    expect(lines.map((line) => JSON.parse(line).level)).toEqual(emitted);
  });

  it.each(["password", "apiToken", "Authorization", "GOOGLE_API_KEY", "sessionCookie"])(
    "redacts the sensitive field %s",
    (key) => {
      const { logger, lines } = buildLogger("info");

      logger.info({ [key]: "valor-secreto" }, "login");

      expect(lines[0]).not.toContain("valor-secreto");
      expect(JSON.parse(lines[0] ?? "")[key]).toBe("[REDACTED]");
    },
  );

  it("serializes errors without the stack", () => {
    const { logger, lines } = buildLogger("error");

    logger.error({ error: new TypeError("falhou") }, "tool_failed");

    expect(JSON.parse(lines[0] ?? "").error).toEqual({ name: "TypeError", message: "falhou" });
  });

  it("merges child bindings into every line", () => {
    const { logger, lines } = buildLogger("info");

    logger.child({ traceId: "t-1" }).info({ step: 2 }, "step_done");

    expect(JSON.parse(lines[0] ?? "")).toMatchObject({ traceId: "t-1", step: 2 });
  });
});
