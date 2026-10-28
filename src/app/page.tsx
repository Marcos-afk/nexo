"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, safeValidateUIMessages, type UIMessage } from "ai";
import { type CSSProperties, type SubmitEvent, useEffect, useState } from "react";

const CHAT_ENDPOINT = "/api/chat";
const HISTORY_TIMEOUT_MS = 10_000;
const HISTORY_ERROR_MESSAGE = "Não foi possível carregar a conversa anterior.";

const pageStyle: CSSProperties = {
  maxWidth: "40rem",
  margin: "2rem auto",
  fontFamily: "sans-serif",
};

const inputStyle: CSSProperties = { width: "80%" };

const textOf = (message: UIMessage): string =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

const fetchHistory = async (): Promise<UIMessage[]> => {
  const response = await fetch(CHAT_ENDPOINT, { signal: AbortSignal.timeout(HISTORY_TIMEOUT_MS) });

  if (!response.ok) {
    throw new Error(HISTORY_ERROR_MESSAGE);
  }

  const validated = await safeValidateUIMessages({ messages: await response.json() });

  if (!validated.success) {
    throw new Error(HISTORY_ERROR_MESSAGE, { cause: validated.error });
  }

  return validated.data;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: CHAT_ENDPOINT }),
  });

  useEffect(() => {
    fetchHistory()
      .then(setMessages)
      .catch(() => setHistoryError(HISTORY_ERROR_MESSAGE));
  }, [setMessages]);

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    void sendMessage({ text: input });
    setInput("");
  };

  return (
    <main style={pageStyle}>
      <h1>Nexo Assist</h1>
      {messages.map((message) => (
        <p key={message.id}>
          <strong>{message.role === "user" ? "Você" : "Nexo"}:</strong> {textOf(message)}
        </p>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={status !== "ready"}
          style={inputStyle}
        />
        <button type="submit" disabled={status !== "ready"}>
          Enviar
        </button>
      </form>
      <small>status: {status}</small>
      {historyError ? <p role="alert">{historyError}</p> : null}
      {error ? <p role="alert">Não foi possível obter a resposta do assistente.</p> : null}
    </main>
  );
}
