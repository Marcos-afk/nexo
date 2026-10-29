import { describe, expect, it, vi } from "vitest";
import { UnknownEmployeeError } from "../../src/domain/errors";
import type { Logger } from "../../src/lib/logger";
import { createAuthService } from "../../src/services/auth/auth-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-29T10:00:00-03:00";

const createLogger = (): Logger => {
  const logger: Logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: () => logger,
  };

  return logger;
};

const setup = async (logger?: Logger) => {
  const database = await createSeededDatabase();

  return createAuthService({
    database,
    clock: createFixedClock(NOW),
    ids: createSequentialIds("profile"),
    ...(logger ? { logger } : {}),
  });
};

describe("profile", () => {
  it("returns the name, e-mail, department and last password change of the employee", async () => {
    const auth = await setup();
    const profile = await auth.profile("emp-ana");

    expect(profile).toMatchObject({
      name: "Ana Souza",
      email: "ana@nexo.test",
      department: "Financeiro",
    });
    expect(profile.passwordChangedAt?.toISOString()).toBe("2026-09-17T12:00:00.000Z");
  });

  it("gives every seeded employee a password change date", async () => {
    const auth = await setup();
    const ids = ["emp-ana", "emp-carla", "emp-bruno", "emp-diego", "emp-fabio", "analyst-rafael"];
    const profiles = await Promise.all(ids.map((id) => auth.profile(id)));

    profiles.forEach((profile) => {
      expect(profile.passwordChangedAt).toBeInstanceOf(Date);
    });
  });

  it("refuses an employee that does not exist", async () => {
    const auth = await setup();

    await expect(auth.profile("emp-ninguem")).rejects.toBeInstanceOf(UnknownEmployeeError);
  });
});

describe("requestPasswordReset", () => {
  it("records the request with the employee id and nothing else", async () => {
    const logger = createLogger();
    const auth = await setup(logger);

    await auth.requestPasswordReset("emp-ana");

    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      { employeeId: "emp-ana" },
      "Password reset requested (simulated, no e-mail sent)",
    );
  });

  it("works without a logger", async () => {
    const auth = await setup();

    await expect(auth.requestPasswordReset("emp-ana")).resolves.toBeUndefined();
  });

  it("refuses an unknown employee without recording anything", async () => {
    const logger = createLogger();
    const auth = await setup(logger);

    await expect(auth.requestPasswordReset("emp-ninguem")).rejects.toBeInstanceOf(
      UnknownEmployeeError,
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});
