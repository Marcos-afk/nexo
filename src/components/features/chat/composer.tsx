"use client";

import { cx } from "class-variance-authority";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatCounterProps, ChatNoticeToneType } from "@/models/chat";
import { useComposer } from "@/viewmodels/use-composer";

const ICON_SIZE = 16;

const COUNTER_CLASSES = {
  info: "text-ink-3",
  warning: "font-semibold text-warning-text",
  danger: "font-semibold text-danger-text",
} as const satisfies Record<ChatNoticeToneType, string>;

interface ComposerProps {
  readonly onSend: (text: string) => void;
  readonly isBusy: boolean;
  readonly isDisabled: boolean;
  readonly placeholder: string;
  readonly counter: ChatCounterProps;
}

export function Composer({ onSend, isBusy, isDisabled, placeholder, counter }: ComposerProps) {
  const { text, inputRef, canSend, onChange, onKeyDown, onSubmit } = useComposer({
    onSend,
    isBusy,
    isDisabled,
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border-strong bg-paper py-1.5 pr-1.5 pl-4 focus-within:border-primary">
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={isDisabled}
          placeholder={placeholder}
          aria-label="Mensagem para o Nexo"
          className="max-h-32 min-w-0 flex-1 resize-none bg-transparent text-sm text-ink outline-none field-sizing-content placeholder:text-ink-3 disabled:cursor-not-allowed"
        />
        <Button.Root type="submit" disabled={!canSend} className="h-9 rounded-md px-3">
          Enviar
          <ArrowRight size={ICON_SIZE} aria-hidden="true" />
        </Button.Root>
      </div>
      <p className={cx("text-right text-xs", COUNTER_CLASSES[counter.tone])}>{counter.text}</p>
    </form>
  );
}
