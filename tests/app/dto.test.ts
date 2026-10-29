import { describe, expect, it } from "vitest";
import { toDraftDto, toDraftStatusDto, toTicketDto } from "../../src/app/api/dto";
import { createDraftService } from "../../src/services/drafts/draft-service";
import { createTicketService } from "../../src/services/tickets/ticket-service";
import { createFixedClock } from "../support/clock";
import { createSeededDatabase } from "../support/database";
import { createSequentialIds } from "../support/ids";

const NOW = "2026-10-28T09:43:00-03:00";
const ANA = "emp-ana";
const ANA_CHAT = "c-ana-chat";
const SEEDED_DRAFT = "D-381";

const setup = async () => {
  const database = await createSeededDatabase();
  const deps = { database, clock: createFixedClock(NOW), ids: createSequentialIds("dto") };

  return { drafts: createDraftService(deps), tickets: createTicketService(deps) };
};

describe("toDraftDto", () => {
  it("describes a new ticket draft with the ticket and the estimated deadline", async () => {
    const { drafts } = await setup();
    const dto = toDraftDto(await drafts.get(ANA, SEEDED_DRAFT));

    expect(dto).toMatchObject({
      id: SEEDED_DRAFT,
      mode: "create",
      status: "pending",
      note: null,
      targetTicketNumber: null,
      ticket: { title: "Monitor externo sem imagem", priority: "high" },
      dueAt: "2026-10-28T16:43:00.000Z",
    });
  });

  it.each([
    {
      name: "an update draft",
      input: { mode: "update", ticketNumber: "INC-20298", note: "Piorou" },
      expected: { ticket: null, note: "Piorou", dueAt: null, targetTicketNumber: "INC-20298" },
    },
    {
      name: "a reopen draft",
      input: { mode: "reopen", ticketNumber: "INC-19877" },
      expected: { ticket: null, note: null, dueAt: null, targetTicketNumber: "INC-19877" },
    },
  ] as const)("describes $name without ticket fields", async ({ input, expected }) => {
    const { drafts } = await setup();
    const proposed = await drafts.propose(ANA, ANA_CHAT, input);

    expect(toDraftDto(await drafts.get(ANA, proposed.id))).toMatchObject(expected);
  });

  it("exposes only the documented fields", async () => {
    const { drafts } = await setup();
    const dto = toDraftDto(await drafts.get(ANA, SEEDED_DRAFT));

    expect(Object.keys(dto).toSorted()).toEqual([
      "conversationId",
      "createdAt",
      "dueAt",
      "id",
      "mode",
      "note",
      "status",
      "targetTicketNumber",
      "ticket",
    ]);
  });
});

describe("toDraftStatusDto", () => {
  it("keeps only the id and the status", async () => {
    const { drafts } = await setup();
    const { draft } = await drafts.get(ANA, SEEDED_DRAFT);

    expect(toDraftStatusDto(draft)).toEqual({ id: SEEDED_DRAFT, status: "pending" });
  });
});

describe("toTicketDto", () => {
  it("never exposes the internal id or the owner", async () => {
    const { drafts } = await setup();
    const { ticket } = await drafts.confirm(ANA, SEEDED_DRAFT);
    const dto = toTicketDto(ticket);

    expect(dto).toMatchObject({ number: "INC-20520", status: "open", resolvedAt: null });
    expect(dto).not.toHaveProperty("id");
    expect(dto).not.toHaveProperty("ownerId");
    expect(typeof dto.dueAt).toBe("string");
  });
});
