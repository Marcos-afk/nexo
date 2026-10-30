import { cx } from "class-variance-authority";
import type { useChatPanel } from "@/viewmodels/use-chat-panel";
import { ChatError } from "./chat-error";
import { EmptyChat } from "./empty-chat";
import { MessageList } from "./message-list";
import { TypingIndicator } from "./typing-indicator";

interface ChatFeedProps {
  readonly chat: ReturnType<typeof useChatPanel>;
}

export function ChatFeed({ chat }: ChatFeedProps) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Conversa com o Nexo"
      className={cx(
        "mx-auto flex min-h-full w-full max-w-202 flex-col gap-5 px-6 pt-7 pb-1",
        chat.isEmpty ? "justify-center" : "justify-end",
      )}
    >
      {chat.isEmpty ? (
        <EmptyChat isDisabled={chat.isComposerDisabled} onSuggest={chat.sendText} />
      ) : (
        <MessageList
          lines={chat.lines}
          isSendDisabled={chat.isComposerDisabled || chat.isBusy}
          onSend={chat.sendText}
        />
      )}
      {chat.isTyping && <TypingIndicator />}
      {chat.replyError && <ChatError message={chat.replyError} onRetry={chat.retry} />}
      <div ref={chat.endRef} />
    </div>
  );
}
