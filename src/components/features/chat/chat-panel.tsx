"use client";

import type { UIMessage } from "ai";
import { cx } from "class-variance-authority";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { useChatPanel } from "@/viewmodels/use-chat-panel";
import { ChatError } from "./chat-error";
import { ChatNotice } from "./chat-notice";
import { Composer } from "./composer";
import { EmptyChat } from "./empty-chat";
import { MessageList } from "./message-list";
import { TypingIndicator } from "./typing-indicator";

interface ChatPanelProps {
  readonly initialMessages: UIMessage[];
  readonly initialSession: ChatSession;
}

export function ChatPanel({ initialMessages, initialSession }: ChatPanelProps) {
  const chat = useChatPanel(initialMessages, initialSession);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cx(
            "mx-auto flex min-h-full w-full max-w-202 flex-col gap-5 px-6 pt-7 pb-1",
            chat.isEmpty ? "justify-center" : "justify-end",
          )}
        >
          {chat.isEmpty ? (
            <EmptyChat isDisabled={chat.isComposerDisabled} onSuggest={chat.sendText} />
          ) : (
            <MessageList lines={chat.lines} />
          )}
          {chat.isTyping && <TypingIndicator />}
          {chat.replyError && <ChatError message={chat.replyError} onRetry={chat.retry} />}
          <div ref={chat.endRef} />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-202 flex-col gap-2 px-6 pt-2.5 pb-4.5">
        {chat.notice && <ChatNotice notice={chat.notice} />}
        <Composer
          onSend={chat.sendText}
          isBusy={chat.isBusy}
          isDisabled={chat.isComposerDisabled}
          placeholder={chat.placeholder}
          counter={chat.counter}
        />
      </div>
    </div>
  );
}
