"use client";

import type { UIMessage } from "ai";
import type { ChatSession } from "@/services/conversations/chat-turn";
import { useChatPanel } from "@/viewmodels/use-chat-panel";
import { ChatFeed } from "./chat-feed";
import { ChatNotice } from "./chat-notice";
import { Composer } from "./composer";

interface ChatPanelProps {
  readonly initialMessages: UIMessage[];
  readonly initialSession: ChatSession;
}

export function ChatPanel({ initialMessages, initialSession }: ChatPanelProps) {
  const chat = useChatPanel(initialMessages, initialSession);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={chat.scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <ChatFeed chat={chat} />
      </div>
      <div className="mx-auto flex w-full max-w-202 flex-col gap-2 px-6 pt-2.5 pb-4.5">
        {chat.notice && (
          <ChatNotice
            notice={chat.notice}
            isWorking={chat.isRequestingAnalyst}
            onAction={chat.onRequestAnalyst}
          />
        )}
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
