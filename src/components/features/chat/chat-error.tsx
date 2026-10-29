import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAT_ERROR_TITLE } from "@/constants/chat";

const ICON_SIZE = 14;

interface ChatErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function ChatError({ message, onRetry }: ChatErrorProps) {
  return (
    <div
      role="alert"
      className="flex max-w-150 flex-col items-start gap-2 rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-danger-text"
    >
      <p>
        <strong className="font-semibold">{CHAT_ERROR_TITLE}</strong> {message}
      </p>
      <Button.Root variant="outline" onClick={onRetry} className="h-8 px-3 text-xs">
        <RotateCcw size={ICON_SIZE} aria-hidden="true" />
        Tentar de novo
      </Button.Root>
    </div>
  );
}
