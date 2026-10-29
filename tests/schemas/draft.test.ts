import { describe, expect, it } from "vitest";
import {
  confirmDraftResponseSchema,
  draftEditSchema,
  draftResponseSchema,
  EMPTY_DESCRIPTION_MESSAGE,
  EMPTY_TITLE_MESSAGE,
  LONG_TITLE_MESSAGE,
} from "../../src/schemas/draft";

const validEdit = {
  title: "VPN não conecta",
  description: "Erro 809 desde ontem.",
  category: "Rede e VPN",
  priority: "high",
  affected: "",
};

const messagesOf = (values: unknown): Record<string, string> => {
  const result = draftEditSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      );
};

describe("draftEditSchema", () => {
  it.each([
    { name: "valid", values: validEdit, expected: {} },
    {
      name: "empty title and description",
      values: { ...validEdit, title: "  ", description: "" },
      expected: { title: EMPTY_TITLE_MESSAGE, description: EMPTY_DESCRIPTION_MESSAGE },
    },
    {
      name: "title over the limit",
      values: { ...validEdit, title: "x".repeat(121) },
      expected: { title: LONG_TITLE_MESSAGE },
    },
    {
      name: "unknown category",
      values: { ...validEdit, category: "SharePoint" },
      expected: { category: expect.any(String) },
    },
    {
      name: "unknown priority",
      values: { ...validEdit, priority: "whenever" },
      expected: { priority: expect.any(String) },
    },
  ])("$name", ({ values, expected }) => {
    expect(messagesOf(values)).toEqual(expected);
  });

  it("trims the text fields", () => {
    expect(
      draftEditSchema.parse({ ...validEdit, title: " VPN ", affected: " Só eu " }),
    ).toMatchObject({ title: "VPN", affected: "Só eu" });
  });
});

const draft = {
  id: "D-381",
  mode: "create",
  status: "pending",
  targetTicketNumber: null,
  ticket: {
    type: "incident",
    category: "Rede e VPN",
    subcategory: null,
    title: "VPN",
    description: "Erro",
    priority: "high",
    affected: null,
  },
  note: null,
  dueAt: "2026-10-29T16:43:00.000Z",
};

describe("draftResponseSchema", () => {
  it.each([
    { name: "a create draft", payload: { draft }, valid: true },
    {
      name: "an update draft without a ticket",
      payload: { draft: { ...draft, mode: "update", ticket: null, note: "Mais detalhes" } },
      valid: true,
    },
    {
      name: "extra fields from the API are ignored",
      payload: { draft: { ...draft, conversationId: "c-1", createdAt: "x" } },
      valid: true,
    },
    { name: "unknown status", payload: { draft: { ...draft, status: "lost" } }, valid: false },
    { name: "missing draft", payload: {}, valid: false },
    {
      name: "invalid embedded ticket",
      payload: { draft: { ...draft, ticket: { title: "" } } },
      valid: false,
    },
  ])("$name", ({ payload, valid }) => {
    expect(draftResponseSchema.safeParse(payload).success).toBe(valid);
  });
});

describe("confirmDraftResponseSchema", () => {
  it.each([
    {
      name: "a confirmed create draft",
      payload: {
        draft: { id: "D-381", status: "confirmed" },
        ticket: { number: "INC-20520", title: "Monitor sem imagem" },
      },
      valid: true,
    },
    {
      name: "without the ticket",
      payload: { draft: { id: "D-381", status: "confirmed" } },
      valid: false,
    },
  ])("$name", ({ payload, valid }) => {
    expect(confirmDraftResponseSchema.safeParse(payload).success).toBe(valid);
  });
});
