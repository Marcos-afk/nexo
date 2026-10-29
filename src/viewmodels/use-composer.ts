import { type ChangeEvent, type KeyboardEvent, type SubmitEvent, useRef, useState } from "react";

interface UseComposerProps {
  readonly onSend: (text: string) => void;
  readonly isBusy: boolean;
  readonly isDisabled: boolean;
}

export function useComposer({ onSend, isBusy, isDisabled }: UseComposerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  return {
    text,
    inputRef,
    canSend,
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value),
    onKeyDown,
    onSubmit,
  };
}
