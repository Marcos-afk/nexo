"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCKED_REPLY_PLACEHOLDER, REPLY_PLACEHOLDER } from "@/constants/console";
import { useComposer } from "@/viewmodels/use-composer";

const ICON_SIZE = 16;

interface ReplyComposerProps {
  readonly isLocked: boolean;
  readonly isBusy: boolean;
  readonly onSend: (content: string) => void;
}

export function ReplyComposer({ isLocked, isBusy, onSend }: ReplyComposerProps) {
  const { text, inputRef, canSend, onChange, onKeyDown, onSubmit } = useComposer({
    onSend,
    isBusy,
    isDisabled: isLocked,
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border-strong bg-paper py-1.5 pr-1.5 pl-4 focus-within:border-primary">
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={isLocked}
          placeholder={isLocked ? LOCKED_REPLY_PLACEHOLDER : REPLY_PLACEHOLDER}
          aria-label="Resposta ao funcionário"
          className="max-h-32 min-w-0 flex-1 resize-none bg-transparent text-sm text-ink outline-none field-sizing-content placeholder:text-ink-3 disabled:cursor-not-allowed"
        />
        <Button.Root type="submit" disabled={!canSend} className="h-9 rounded-md px-3">
          Enviar
          <ArrowRight size={ICON_SIZE} aria-hidden="true" />
        </Button.Root>
      </div>
    </form>
  );
}
