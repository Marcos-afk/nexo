import { type ChangeEvent, type KeyboardEvent, type SubmitEvent, useRef, useState } from "react";

interface UseComposerProps {
  readonly onSend: (text: string) => unknown;
  readonly onTyping?: () => void;
  readonly isBusy: boolean;
  readonly isDisabled: boolean;
}

const isSubmitKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean =>
  event.key === "Enter" &&
  !(event.shiftKey || event.metaKey || event.ctrlKey) &&
  !event.nativeEvent.isComposing;

export function useComposer({ onSend, onTyping, isBusy, isDisabled }: UseComposerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canSend = text.trim().length > 0 && !isBusy && !isDisabled;

  const send = async () => {
    if (!canSend) {
      return;
    }

    const sent = await onSend(text.trim());

    if (sent === false) {
      return;
    }

    setText("");
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSubmitKey(event)) {
      return;
    }

    event.preventDefault();
    void send();
  };

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    void send();
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);

    if (event.target.value.trim().length > 0) {
      onTyping?.();
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
