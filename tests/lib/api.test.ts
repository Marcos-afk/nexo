import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, api } from "../../src/lib/api";

const GENERIC_MESSAGE = "Não foi possível concluir a operação. Tente novamente em instantes.";
const HTTP_NO_CONTENT = 204;
const HTTP_UNAUTHORIZED = 401;

const stubFetch = (respond: () => Promise<Response>) => vi.stubGlobal("fetch", vi.fn(respond));

const rejectionOf = async (promise: Promise<unknown>): Promise<ApiError> => {
  const error = await promise.then(
    () => null,
    (cause: unknown) => cause,
  );

  expect(error).toBeInstanceOf(ApiError);

  return error as ApiError;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api.post", () => {
  it("returns the validated body", async () => {
    stubFetch(async () => Response.json({ name: "Ana" }));

    await expect(api.post("/x", { a: 1 }, z.object({ name: z.string() }))).resolves.toEqual({
      name: "Ana",
    });
  });

  it("sends the body as JSON", async () => {
    const fetchMock = vi.fn(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    await api.post("/x", { a: 1 }, z.object({}));

    expect(fetchMock).toHaveBeenCalledWith(
      "/x",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ a: 1 }) }),
    );
  });

  it("accepts an empty 204 response with a void schema", async () => {
    stubFetch(async () => new Response(null, { status: HTTP_NO_CONTENT }));

    await expect(api.post("/x", undefined, z.void())).resolves.toBeUndefined();
  });

  it.each([
    {
      name: "server error message",
      respond: async () =>
        Response.json({ error: "Credenciais inválidas." }, { status: HTTP_UNAUTHORIZED }),
      status: HTTP_UNAUTHORIZED,
      message: "Credenciais inválidas.",
    },
    {
      name: "failure without a readable body",
      respond: async () => new Response("oops", { status: 500 }),
      status: 500,
      message: GENERIC_MESSAGE,
    },
    {
      name: "response that breaks the schema",
      respond: async () => Response.json({ other: true }),
      status: 200,
      message: GENERIC_MESSAGE,
    },
    {
      name: "network failure",
      respond: async () => {
        throw new TypeError("fetch failed");
      },
      status: 0,
      message: GENERIC_MESSAGE,
    },
  ])("$name", async ({ respond, status, message }) => {
    stubFetch(respond);

    const error = await rejectionOf(api.post("/x", {}, z.object({ name: z.string() })));

    expect(error.status).toBe(status);
    expect(error.message).toBe(message);
  });
});

describe("api.get", () => {
  it("requests with GET and no body, returning the validated payload", async () => {
    const fetchMock = vi.fn(async () => Response.json({ name: "Ana" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/x", z.object({ name: z.string() }))).resolves.toEqual({ name: "Ana" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/x",
      expect.objectContaining({ method: "GET", body: null }),
    );
  });

  it("fails with a network error when the caller aborts", async () => {
    stubFetch(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    const controller = new AbortController();
    controller.abort();

    const error = await rejectionOf(api.get("/x", z.object({}), controller.signal));

    expect(error.status).toBe(0);
  });
});

describe("api.patch", () => {
  it("sends the body with PATCH and returns the validated payload", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.patch("/x", { a: 1 }, z.object({ ok: z.boolean() }))).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/x",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ a: 1 }) }),
    );
  });
});
