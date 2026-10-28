import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { conversations } from "../../src/db/schema";
import { ConversationClosedError, ConversationNotFoundError } from "../../src/domain/errors";
import { createConversationService } from "../../src/services/conversations/conversation-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T10:00:00-03:00";
const ANA = "emp-ana";
const CARLA = "emp-carla";
const FABIO = "emp-fabio";
const ANA_CHAT = "c-ana-chat";
const FABIO_CLOSED = { ownerId: FABIO, conversationId: "c-fabio" };

const createService = async () => {
  const database = await createSeededDatabase();
  const service = createConversationService({
    database,
    clock: createFixedClock(NOW),
    ids: createSequentialIds("new"),
  });

  return { database, service };
};

interface ActiveCase {
  readonly name: string;
  readonly ownerId: string;
  readonly expected: string | null;
}

const activeCases: readonly ActiveCase[] = [
  { name: "the most recently updated open one", ownerId: ANA, expected: ANA_CHAT },
  { name: "an awaiting-analyst one", ownerId: CARLA, expected: "c-carla" },
  { name: "none when every conversation is closed", ownerId: FABIO, expected: null },
  { name: "none for an employee without conversations", ownerId: "analyst-rafael", expected: null },
];

describe("active conversation", () => {
  it.each(activeCases)("returns $name", async ({ ownerId, expected }) => {
    const { service } = await createService();

    expect((await service.getActive(ownerId))?.id ?? null).toBe(expected);
  });

  it("starts a new conversation in agent mode", async () => {
    const { service } = await createService();
    const conversation = await service.start(FABIO);

    expect(conversation).toMatchObject({ id: "new-1", mode: "agent", employeeId: FABIO });
    expect((await service.getActive(FABIO))?.id).toBe("new-1");
  });
});

describe("messages", () => {
  it("lists the messages in chronological order", async () => {
    const { service } = await createService();
    const list = await service.listMessages({ ownerId: ANA, conversationId: ANA_CHAT });

    expect(list.map((message) => message.authorKind)).toEqual(["employee", "agent"]);
  });

  it("keeps only the latest messages when limited", async () => {
    const { service } = await createService();
    const list = await service.listMessages({ ownerId: ANA, conversationId: ANA_CHAT }, 1);

    expect(list.map((message) => message.authorKind)).toEqual(["agent"]);
  });

  it("appends a message, sets the author and touches the conversation", async () => {
    const { database, service } = await createService();
    const ref = { ownerId: ANA, conversationId: ANA_CHAT };
    const message = await service.appendMessage(ref, { authorKind: "employee", content: "Oi" });
    const [conversation] = await database
      .select()
      .from(conversations)
      .where(eq(conversations.id, ANA_CHAT));

    expect(message).toMatchObject({ authorId: ANA, parts: null });
    expect(conversation?.updatedAt.toISOString()).toBe(new Date(NOW).toISOString());
    expect((await service.listMessages(ref)).at(-1)?.content).toBe("Oi");
  });

  it("does not attribute agent messages to the employee", async () => {
    const { service } = await createService();
    const ref = { ownerId: ANA, conversationId: ANA_CHAT };
    const message = await service.appendMessage(ref, { authorKind: "agent", content: "Certo" });

    expect(message.authorId).toBeNull();
  });
});

describe("privacy and closing", () => {
  it("treats another employee conversation as nonexistent", async () => {
    const { service } = await createService();
    const ref = { ownerId: CARLA, conversationId: ANA_CHAT };

    await expect(service.listMessages(ref)).rejects.toBeInstanceOf(ConversationNotFoundError);
    await expect(
      service.appendMessage(ref, { authorKind: "employee", content: "x" }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    await expect(service.close(ref)).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("refuses messages on a closed conversation", async () => {
    const { service } = await createService();

    await expect(
      service.appendMessage(FABIO_CLOSED, { authorKind: "employee", content: "x" }),
    ).rejects.toBeInstanceOf(ConversationClosedError);
  });

  it("closes a conversation and stops offering it as active", async () => {
    const { service } = await createService();
    const closed = await service.close({ ownerId: ANA, conversationId: ANA_CHAT });

    expect(closed.mode).toBe("closed");
    expect((await service.getActive(ANA))?.id).toBe("c-ana-handoff");
  });
});
