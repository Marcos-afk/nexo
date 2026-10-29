import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/lib/api";
import { createChatFetch } from "../../src/lib/chat-fetch";

const HTTP_ACCEPTED = 202;
const HTTP_TOO_MANY_REQUESTS = 429;

const stubFetch = (respond: () => Promise<Response>) => vi.stubGlobal("fetch", vi.fn(respond));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createChatFetch", () => {
  it("passes a streamed reply through untouched", async () => {
    const original = new Response("data: ok\n\n", { status: 200 });
    stubFetch(async () => original);

    await expect(createChatFetch(vi.fn())("/api/chat")).resolves.toBe(original);
  });

  it.each(["awaiting_analyst", "with_analyst"] as const)(
    "reports the %s mode on a skipped turn and returns an empty reply stream",
    async (mode) => {
      const onSkipped = vi.fn();
      stubFetch(async () => Response.json({ mode }, { status: HTTP_ACCEPTED }));

      const response = await createChatFetch(onSkipped)("/api/chat");

      expect(onSkipped).toHaveBeenCalledExactlyOnceWith(mode);
      expect(response.ok).toBe(true);
      expect(response.headers.get("content-type")).toContain("text/event-stream");
    },
  );

  it("still returns an empty stream when the skipped body is unreadable", async () => {
    const onSkipped = vi.fn();
    stubFetch(async () => new Response("???", { status: HTTP_ACCEPTED }));

    const response = await createChatFetch(onSkipped)("/api/chat");

    expect(onSkipped).not.toHaveBeenCalled();
    expect(response.ok).toBe(true);
  });

  it("raises the server message on a failed request", async () => {
    stubFetch(async () =>
      Response.json({ error: "Limite de mensagens atingido." }, { status: HTTP_TOO_MANY_REQUESTS }),
    );

    const error = await createChatFetch(vi.fn())("/api/chat").then(
      () => null,
      (cause: unknown) => cause,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: HTTP_TOO_MANY_REQUESTS,
      message: "Limite de mensagens atingido.",
    });
  });
});
