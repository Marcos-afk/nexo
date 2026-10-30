"use client";

import { cx } from "class-variance-authority";
import { ArrowUp } from "lucide-react";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/domain/input-limits";
import type { ChatCounterProps, ChatNoticeToneType } from "@/models/chat";
import { lengthCounterOf } from "@/utils/chat-state";
import { useComposer } from "@/viewmodels/use-composer";
import { useTypingSignal } from "@/viewmodels/use-typing-signal";

const ICON_SIZE = 14;

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
    onTyping: useTypingSignal(),
    isBusy,
    isDisabled,
  });

  const lengthCounter = lengthCounterOf(text.length);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-ink/12 bg-paper py-1.5 pr-1.5 pl-4 focus-within:border-primary">
        <textarea
          ref={inputRef}
          rows={1}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={isDisabled}
          placeholder={placeholder}
          aria-label="Mensagem para o Nexo"
          className="max-h-32 min-w-0 flex-1 resize-none bg-transparent text-[14.5px] text-ink outline-none field-sizing-content placeholder:text-ink-3 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-9 items-center justify-center gap-1.5 rounded-sm bg-cta px-3 text-[13.5px] font-semibold text-white transition hover:bg-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowUp size={ICON_SIZE} aria-hidden="true" />
          Enviar
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className={cx(lengthCounter && COUNTER_CLASSES[lengthCounter.tone])}>
          {lengthCounter?.text}
        </p>
        <p className={COUNTER_CLASSES[counter.tone]}>{counter.text}</p>
      </div>
    </form>
  );
}
