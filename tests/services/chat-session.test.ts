import { describe, expect, it } from "vitest";
import { beginChatTurn, loadChatSession } from "../../src/services/conversations/chat-turn";
import { SESSION_MESSAGE_LIMIT } from "../../src/services/conversations/history";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T10:00:00-03:00";
const FABIO = "emp-fabio";

const createDeps = async () => ({
  database: await createSeededDatabase(),
  clock: createFixedClock(NOW),
  ids: createSequentialIds("session"),
});

describe("loadChatSession", () => {
  it("reports an empty agent session when the employee has no open conversation", async () => {
    const deps = await createDeps();

    await expect(loadChatSession(deps, FABIO)).resolves.toEqual({
      mode: "agent",
      employeeMessageCount: 0,
      messageLimit: SESSION_MESSAGE_LIMIT,
    });
  });

  it("counts only the messages the employee sent in the active conversation", async () => {
    const deps = await createDeps();

    await beginChatTurn(deps, FABIO, "primeira");
    await beginChatTurn(deps, FABIO, "segunda");

    await expect(loadChatSession(deps, FABIO)).resolves.toEqual({
      mode: "agent",
      employeeMessageCount: 2,
      messageLimit: SESSION_MESSAGE_LIMIT,
    });
  });
});
