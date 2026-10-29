import { Button } from "@/components/ui/button";
import { EMPTY_CHAT_SUBTITLE, EMPTY_CHAT_SUGGESTIONS, EMPTY_CHAT_TITLE } from "@/constants/chat";

interface EmptyChatProps {
  readonly isDisabled: boolean;
  readonly onSuggest: (text: string) => void;
}

export function EmptyChat({ isDisabled, onSuggest }: EmptyChatProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <h2 className="font-display text-3xl tracking-tight text-ink">{EMPTY_CHAT_TITLE}</h2>
      <p className="max-w-md text-sm text-ink-3">{EMPTY_CHAT_SUBTITLE}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {EMPTY_CHAT_SUGGESTIONS.map((suggestion) => (
          <Button.Root
            key={suggestion}
            variant="outline"
            disabled={isDisabled}
            onClick={() => onSuggest(suggestion)}
            className="h-auto rounded-lg px-3 py-1.75 font-medium"
          >
            {suggestion}
          </Button.Root>
        ))}
      </div>
    </div>
  );
}
