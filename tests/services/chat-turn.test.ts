import { describe, expect, it } from "vitest";
import { SessionMessageLimitReachedError } from "../../src/domain/errors";
import {
  beginChatTurn,
  loadActiveConversationMessages,
  recordAgentReply,
} from "../../src/services/conversations/chat-turn";
import { createConversationService } from "../../src/services/conversations/conversation-service";
import { extractText, SESSION_MESSAGE_LIMIT } from "../../src/services/conversations/history";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T10:00:00-03:00";
const FABIO = "emp-fabio";

const createDeps = async () => ({
  database: await createSeededDatabase(),
  clock: createFixedClock(NOW),
  ids: createSequentialIds("turn"),
});

describe("beginChatTurn", () => {
  it("starts a conversation when the employee has none open and stores the question", async () => {
    const deps = await createDeps();
    const turn = await beginChatTurn(deps, FABIO, "Meu VPN caiu");
    const stored = await createConversationService(deps).listMessages(turn.ref);

    expect(stored.map((message) => message.content)).toEqual(["Meu VPN caiu"]);
    expect(turn.history.map(extractText)).toEqual(["Meu VPN caiu"]);
  });

  it("reuses the active conversation and returns the history in order", async () => {
    const deps = await createDeps();
    const first = await beginChatTurn(deps, FABIO, "primeira");

    await recordAgentReply(deps, first.ref, {
      id: "r-1",
      role: "assistant",
      parts: [{ type: "text", text: "resposta" }],
    });
    const second = await beginChatTurn(deps, FABIO, "segunda");

    expect(second.ref.conversationId).toBe(first.ref.conversationId);
    expect(second.history.map((message) => message.role)).toEqual(["user", "assistant", "user"]);
    expect(second.history.map(extractText)).toEqual(["primeira", "resposta", "segunda"]);
  });

  it("blocks the message after the session limit without storing it", async () => {
    const deps = await createDeps();
    const turns = await Array.from({ length: SESSION_MESSAGE_LIMIT }, (_, sent) => sent).reduce(
      async (previous, sent) => [
        ...(await previous),
        await beginChatTurn(deps, FABIO, `m ${sent}`),
      ],
      Promise.resolve<readonly Awaited<ReturnType<typeof beginChatTurn>>[]>([]),
    );

    await expect(beginChatTurn(deps, FABIO, "uma a mais")).rejects.toBeInstanceOf(
      SessionMessageLimitReachedError,
    );

    const [firstTurn] = turns;

    expect(
      firstTurn && (await createConversationService(deps).countEmployeeMessages(firstTurn.ref)),
    ).toBe(SESSION_MESSAGE_LIMIT);
  });
});

describe("beginChatTurn: conversation mode", () => {
  it("reports the mode and still stores the message when the conversation is with the queue", async () => {
    const deps = await createDeps();
    const turn = await beginChatTurn(deps, "emp-carla", "alguma novidade?");
    const stored = await createConversationService(deps).listMessages(turn.ref);

    expect(turn.mode).toBe("awaiting_analyst");
    expect(stored.at(-1)?.content).toBe("alguma novidade?");
  });

  it("reports the agent mode for a fresh conversation", async () => {
    const deps = await createDeps();

    expect((await beginChatTurn(deps, FABIO, "oi")).mode).toBe("agent");
  });
});

describe("recordAgentReply", () => {
  it("ignores a reply that has only a step-start part", async () => {
    const deps = await createDeps();
    const turn = await beginChatTurn(deps, FABIO, "oi");

    await recordAgentReply(deps, turn.ref, {
      id: "r-1",
      role: "assistant",
      parts: [{ type: "step-start" }],
    });

    const stored = await createConversationService(deps).listMessages(turn.ref);

    expect(stored).toHaveLength(1);
  });
});

describe("loadActiveConversationMessages", () => {
  it("is empty for an employee without an open conversation", async () => {
    const deps = await createDeps();

    expect(await loadActiveConversationMessages(deps, FABIO)).toEqual([]);
  });
});
