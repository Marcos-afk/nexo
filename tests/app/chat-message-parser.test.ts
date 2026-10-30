import { describe, expect, it } from "vitest";
import { LONG_MESSAGE_TEXT, parseLastUserText } from "../../src/app/api/chat/parse-message";
import { MAX_CHAT_MESSAGE_LENGTH, MAX_CHAT_MESSAGES } from "../../src/domain/input-limits";

const HTTP_BAD_REQUEST = 400;

const userMessage = (text: string, id = "m-1") => ({
  id,
  role: "user",
  parts: [{ type: "text", text }],
});

const postBody = (body: unknown): Request =>
  new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const errorOf = async (result: string | Response): Promise<string | undefined> =>
  result instanceof Response ? ((await result.json()) as { error: string }).error : undefined;

describe("parseLastUserText", () => {
  it.each([
    { name: "a short message", text: "Meu notebook não liga", expected: "Meu notebook não liga" },
    { name: "surrounding spaces", text: "  oi  ", expected: "oi" },
    {
      name: "exactly the limit",
      text: "a".repeat(MAX_CHAT_MESSAGE_LENGTH),
      expected: "a".repeat(MAX_CHAT_MESSAGE_LENGTH),
    },
  ])("accepts $name", async ({ text, expected }) => {
    expect(await parseLastUserText(postBody({ messages: [userMessage(text)] }))).toBe(expected);
  });

  it.each([
    {
      name: "one character over the limit",
      body: { messages: [userMessage("a".repeat(MAX_CHAT_MESSAGE_LENGTH + 1))] },
      error: LONG_MESSAGE_TEXT,
    },
    {
      name: "a long message padded with spaces that still exceeds the limit",
      body: { messages: [userMessage(`x${" ".repeat(10)}${"y".repeat(MAX_CHAT_MESSAGE_LENGTH)}`)] },
      error: LONG_MESSAGE_TEXT,
    },
    {
      name: "an empty message",
      body: { messages: [userMessage("   ")] },
      error: "A mensagem não pode ficar vazia.",
    },
    {
      name: "too many messages",
      body: {
        messages: Array.from({ length: MAX_CHAT_MESSAGES + 1 }, (_, index) =>
          userMessage("oi", `m-${index}`),
        ),
      },
      error: "Corpo da requisição inválido.",
    },
    { name: "no messages", body: { messages: [] }, error: "Corpo da requisição inválido." },
    { name: "a body that is not JSON", body: "oops", error: "Corpo da requisição inválido." },
  ])("rejects $name", async ({ body, error }) => {
    const result = await parseLastUserText(postBody(body));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(HTTP_BAD_REQUEST);
    expect(await errorOf(result)).toBe(error);
  });

  it("accepts the maximum number of messages", async () => {
    const messages = Array.from({ length: MAX_CHAT_MESSAGES }, (_, index) =>
      userMessage("oi", `m-${index}`),
    );

    expect(await parseLastUserText(postBody({ messages }))).toBe("oi");
  });
});
