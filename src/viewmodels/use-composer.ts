import { type ChangeEvent, type KeyboardEvent, type SubmitEvent, useRef, useState } from "react";
import { useTypingSignal } from "./use-typing-signal";

interface UseComposerProps {
  readonly onSend: (text: string) => void;
  readonly isBusy: boolean;
  readonly isDisabled: boolean;
}

export function useComposer({ onSend, isBusy, isDisabled }: UseComposerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const signalTyping = useTypingSignal();

  const canSend = text.trim().length > 0 && !isBusy && !isDisabled;

  const send = () => {
    if (!canSend) {
      return;
    }

    onSend(text.trim());
    setText("");
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const isModified = event.shiftKey || event.metaKey || event.ctrlKey;

    if (event.key !== "Enter" || isModified || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    send();
  };

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    send();
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);

    if (event.target.value.trim().length > 0) {
      signalTyping();
    }
  };

  return {
    text,
    inputRef,
    canSend,
    onChange,
    onKeyDown,
    onSubmit,
  };
}
