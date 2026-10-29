import { describe, expect, it } from "vitest";
import { ticketStatuses, ticketStatusLabels } from "../../src/domain/ticket";
import { toneOfTicketStatus } from "../../src/utils/ticket-status";

const EXPECTED_TONES = {
  open: "info",
  in_progress: "info",
  awaiting_analyst: "warning",
  in_service: "violet",
  approved: "success",
  resolved: "success",
} as const;

describe("toneOfTicketStatus", () => {
  it.each(ticketStatuses.map((status) => ({ status, label: ticketStatusLabels[status] })))(
    "$label is read from the label the tools return",
    ({ status, label }) => {
      expect(toneOfTicketStatus(label)).toBe(EXPECTED_TONES[status]);
    },
  );

  it("falls back to neutral for a label it does not know", () => {
    expect(toneOfTicketStatus("Em limbo")).toBe("neutral");
  });
});
