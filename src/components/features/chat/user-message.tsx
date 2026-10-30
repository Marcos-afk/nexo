import type { ChatLineProps } from "@/models/chat";

interface UserMessageProps {
  readonly line: ChatLineProps;
}

export function UserMessage({ line }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <p className="max-w-130 rounded-xl rounded-br-sm bg-ink px-4 py-2.75 text-[14.5px] leading-[1.45] whitespace-pre-wrap text-white">
        {line.text}
      </p>
    </div>
  );
}
