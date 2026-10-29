"use client";

import type { UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatPanel } from "@/viewmodels/use-chat-panel";

interface ChatPanelProps {
  readonly initialMessages: UIMessage[];
}

export function ChatPanel({ initialMessages }: ChatPanelProps) {
  const { lines, input, setInput, onSubmit, status, isBusy, hasError } =
    useChatPanel(initialMessages);

  return (
    <main className="mx-auto my-8 flex max-w-2xl flex-col gap-4 px-4 text-ink">
      <h1 className="font-display text-3xl tracking-tight">Nexo Assist</h1>
      {lines.map((line) => (
        <p key={line.id} className="text-ink-2">
          <strong className="font-semibold text-ink">{line.author}:</strong> {line.text}
        </p>
      ))}
      <form className="flex gap-2" onSubmit={onSubmit}>
        <Input.Root className="flex-1">
          <Input.Field
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isBusy}
          />
        </Input.Root>
        <Button.Root type="submit" disabled={isBusy}>
          Enviar
        </Button.Root>
      </form>
      <small className="font-data text-xs text-ink-3">status: {status}</small>
      {hasError && (
        <p role="alert" className="text-danger-text">
          Não foi possível obter a resposta do assistente.
        </p>
      )}
    </main>
  );
}
