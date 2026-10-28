import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { drafts, tickets } from "../../src/db/schema";
import type { DraftInput } from "../../src/domain/draft";
import {
  ConversationNotFoundError,
  DraftNotFoundError,
  DraftNotPendingError,
  DraftPayloadInvalidError,
  TicketNotFoundError,
  TicketNotReopenableError,
} from "../../src/domain/errors";
import { createDraftService } from "../../src/services/drafts/draft-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T09:43:00-03:00";
const ANA = "emp-ana";
const CARLA = "emp-carla";
const ANA_CHAT = "c-ana-chat";
const CARLA_CHAT = "c-carla";
const SEEDED_DRAFT = "D-381";

const monitorTicket = {
  type: "incident",
  category: "Hardware",
  subcategory: "Periféricos",
  title: "Monitor externo sem imagem",
  description: "O monitor externo parou de dar imagem.",
  priority: "high",
  affected: "Somente eu",
} as const;

const createService = async () => {
  const database = await createSeededDatabase();
  const service = createDraftService({
    database,
    clock: createFixedClock(NOW),
    ids: createSequentialIds("new"),
  });

  return { database, service };
};

const statusOf = async (
  database: Awaited<ReturnType<typeof createService>>["database"],
  draftId: string,
) => {
  const [draft] = await database.select().from(drafts).where(eq(drafts.id, draftId));

  return draft?.status;
};

interface ProposalCase {
  readonly name: string;
  readonly input: DraftInput;
  readonly mode: string;
  readonly hasTarget: boolean;
}

const proposalCases: readonly ProposalCase[] = [
  {
    name: "a new ticket",
    input: { mode: "create", ticket: monitorTicket },
    mode: "create",
    hasTarget: false,
  },
  {
    name: "a note on an open ticket",
    input: { mode: "update", ticketNumber: "INC-20298", note: "Agora também falha no Teams" },
    mode: "update",
    hasTarget: true,
  },
];

describe("propose", () => {
  it.each(proposalCases)("stores a pending draft for $name", async ({ input, mode, hasTarget }) => {
    const { service } = await createService();
    const draft = await service.propose(ANA, ANA_CHAT, input);

    expect(draft).toMatchObject({ mode, status: "pending" });
    expect(draft.targetTicketId !== null).toBe(hasTarget);
  });

  it("replaces the pending draft of the conversation", async () => {
    const { database, service } = await createService();
    const draft = await service.propose(ANA, ANA_CHAT, { mode: "create", ticket: monitorTicket });

    expect(await statusOf(database, SEEDED_DRAFT)).toBe("cancelled");
    expect((await service.getPending(ANA, ANA_CHAT))?.id).toBe(draft.id);
  });

  it("refuses a conversation that belongs to someone else", async () => {
    const { service } = await createService();

    await expect(
      service.propose(CARLA, ANA_CHAT, { mode: "create", ticket: monitorTicket }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("refuses to target a ticket that belongs to someone else", async () => {
    const { service } = await createService();

    await expect(
      service.propose(ANA, ANA_CHAT, { mode: "reopen", ticketNumber: "INC-20150" }),
    ).rejects.toBeInstanceOf(TicketNotFoundError);
  });
});

describe("confirm", () => {
  it("creates the ticket from the seeded draft and marks it confirmed", async () => {
    const { database, service } = await createService();
    const { draft, ticket } = await service.confirm(ANA, SEEDED_DRAFT);

    expect(ticket).toMatchObject({ number: "INC-20520", ownerId: ANA, title: monitorTicket.title });
    expect(draft.status).toBe("confirmed");
    expect(await statusOf(database, SEEDED_DRAFT)).toBe("confirmed");
  });

  it("appends the note of an update draft to the target ticket", async () => {
    const { service } = await createService();
    const input: DraftInput = { mode: "update", ticketNumber: "INC-20298", note: "Falha no Teams" };
    const proposed = await service.propose(ANA, ANA_CHAT, input);
    const { ticket } = await service.confirm(ANA, proposed.id);

    expect(ticket.number).toBe("INC-20298");
    expect(ticket.updatedAt.toISOString()).toBe(new Date(NOW).toISOString());
  });

  it("reopens the target of a reopen draft", async () => {
    const { database, service } = await createService();
    const proposed = await service.propose(CARLA, CARLA_CHAT, {
      mode: "reopen",
      ticketNumber: "INC-20150",
    });
    const { ticket } = await service.confirm(CARLA, proposed.id);
    const [stored] = await database.select().from(tickets).where(eq(tickets.id, ticket.id));

    expect(stored?.status).toBe("open");
  });

  it("is not confirmed twice", async () => {
    const { service } = await createService();
    await service.confirm(ANA, SEEDED_DRAFT);

    await expect(service.confirm(ANA, SEEDED_DRAFT)).rejects.toBeInstanceOf(DraftNotPendingError);
  });

  it("does not expose the draft of another employee", async () => {
    const { service } = await createService();

    await expect(service.confirm(CARLA, SEEDED_DRAFT)).rejects.toBeInstanceOf(DraftNotFoundError);
  });

  it("returns the draft to pending when applying it fails", async () => {
    const { database, service } = await createService();
    const proposed = await service.propose(ANA, ANA_CHAT, {
      mode: "reopen",
      ticketNumber: "INC-19877",
    });

    await expect(service.confirm(ANA, proposed.id)).rejects.toBeInstanceOf(
      TicketNotReopenableError,
    );
    expect(await statusOf(database, proposed.id)).toBe("pending");
  });

  it("rejects a stored payload that fails validation", async () => {
    const { database, service } = await createService();
    await database
      .update(drafts)
      .set({ payload: { title: "sem tipo" } })
      .where(eq(drafts.id, SEEDED_DRAFT));

    await expect(service.confirm(ANA, SEEDED_DRAFT)).rejects.toBeInstanceOf(
      DraftPayloadInvalidError,
    );
    expect(await statusOf(database, SEEDED_DRAFT)).toBe("pending");
  });
});

describe("cancel", () => {
  it("cancels a pending draft without creating a ticket", async () => {
    const { database, service } = await createService();
    const cancelled = await service.cancel(ANA, SEEDED_DRAFT);
    const created = await database.select().from(tickets).where(eq(tickets.number, "INC-20520"));

    expect(cancelled.status).toBe("cancelled");
    expect(created).toEqual([]);
    expect(await service.getPending(ANA, ANA_CHAT)).toBeNull();
  });
});
