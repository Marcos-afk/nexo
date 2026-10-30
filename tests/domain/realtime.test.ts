import { describe, expect, it } from "vitest";
import { type EventAudience, isVisibleTo, type RealtimeEvent } from "../../src/domain/realtime";

const event: RealtimeEvent = {
  type: "conversation.updated",
  conversationId: "c-1",
  ownerId: "emp-ana",
  at: "2026-10-28T13:00:00.000Z",
  mode: "agent",
  assignedAnalystId: null,
};

describe("isVisibleTo for typing", () => {
  it("shows the typing signal to analysts and hides it from other employees", () => {
    const typing: RealtimeEvent = {
      type: "typing.started",
      conversationId: "c-1",
      ownerId: "emp-ana",
      at: "2026-10-28T13:00:00.000Z",
    };

    expect(isVisibleTo(typing, { id: "analyst-rafael", role: "analyst" })).toBe(true);
    expect(isVisibleTo(typing, { id: "emp-carla", role: "employee" })).toBe(false);
  });
});

describe("isVisibleTo", () => {
  it.each<{ name: string; audience: EventAudience; visible: boolean }>([
    {
      name: "an analyst sees any conversation",
      audience: { id: "analyst-rafael", role: "analyst" },
      visible: true,
    },
    {
      name: "the owner sees their conversation",
      audience: { id: "emp-ana", role: "employee" },
      visible: true,
    },
    {
      name: "another employee does not",
      audience: { id: "emp-carla", role: "employee" },
      visible: false,
    },
  ])("$name", ({ audience, visible }) => {
    expect(isVisibleTo(event, audience)).toBe(visible);
  });
});
