"use client";

import { SendHorizontal } from "lucide-react";
import { LOCKED_REPLY_PLACEHOLDER, REPLY_PLACEHOLDER } from "@/constants/console";
import { MAX_ANALYST_REPLY_LENGTH } from "@/domain/input-limits";
import { useComposer } from "@/viewmodels/use-composer";

const ICON_SIZE = 18;

interface ReplyComposerProps {
  readonly isLocked: boolean;
  readonly isBusy: boolean;
  readonly onSend: (content: string) => Promise<boolean>;
}

export function ReplyComposer({ isLocked, isBusy, onSend }: ReplyComposerProps) {
  const { text, inputRef, canSend, onChange, onKeyDown, onSubmit } = useComposer({
    onSend,
    isBusy,
    isDisabled: isLocked,
  });

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl bg-desk px-3.5 focus-within:outline-2 focus-within:outline-primary">
        <textarea
          ref={inputRef}
          rows={1}
          maxLength={MAX_ANALYST_REPLY_LENGTH}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={isLocked}
          placeholder={isLocked ? LOCKED_REPLY_PLACEHOLDER : REPLY_PLACEHOLDER}
          aria-label="Resposta ao funcionário"
          className="max-h-32 min-w-0 flex-1 resize-none bg-transparent text-sm text-ink outline-none field-sizing-content placeholder:text-ink-3 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Enviar resposta"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cta text-white transition hover:bg-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SendHorizontal size={ICON_SIZE} aria-hidden="true" />
      </button>
    </form>
  );
}
