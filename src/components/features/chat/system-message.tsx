import type { ChatLineProps } from "@/models/chat";

interface SystemMessageProps {
  readonly line: ChatLineProps;
}

export function SystemMessage({ line }: SystemMessageProps) {
  return (
    <div className="flex justify-center">
      <p className="rounded-full bg-card px-3 py-1 text-center text-xs text-ink-3">{line.text}</p>
    </div>
  );
}
