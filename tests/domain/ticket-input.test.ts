import { describe, expect, it } from "vitest";
import { ticketCategories } from "../../src/domain/ticket-category";
import { createTicketInputSchema } from "../../src/domain/ticket-input";

const baseTicket = {
  type: "incident",
  subcategory: null,
  title: "VPN cai",
  description: "A VPN cai a cada 10 minutos.",
  priority: "high",
  affected: "Somente eu",
};

describe("createTicketInputSchema: category", () => {
  it.each(ticketCategories)("accepts %s", (category) => {
    expect(createTicketInputSchema.safeParse({ ...baseTicket, category }).success).toBe(true);
  });

  it.each(["Rede", "SharePoint", "Equipamento", ""])("rejects %j", (category) => {
    expect(createTicketInputSchema.safeParse({ ...baseTicket, category }).success).toBe(false);
  });
});
