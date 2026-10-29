import { useEffect, useEffectEvent } from "react";
import { EVENTS_ENDPOINT } from "@/constants/chat";
import type { ConversationMode, MessageAuthorKind } from "@/domain/conversation";
import { conversationUpdatedEventSchema, messageCreatedEventSchema } from "@/schemas/events";
import { parseEventData } from "@/utils/parse-event";

interface ChatEventHandlers {
  readonly onMessage: (authorKind: MessageAuthorKind) => void;
  readonly onMode: (mode: ConversationMode) => void;
  readonly onResync: () => void;
}

export function useChatEvents(handlers: ChatEventHandlers) {
  const onMessage = useEffectEvent((authorKind: MessageAuthorKind) =>
    handlers.onMessage(authorKind),
  );
  const onMode = useEffectEvent((mode: ConversationMode) => handlers.onMode(mode));
  const onResync = useEffectEvent(() => handlers.onResync());

  useEffect(() => {
    const source = new EventSource(EVENTS_ENDPOINT);

    source.addEventListener("message.created", (event) => {
      const data = parseEventData(event.data, messageCreatedEventSchema);

      if (data) {
        onMessage(data.authorKind);
      }
    });
    source.addEventListener("conversation.updated", (event) => {
      const data = parseEventData(event.data, conversationUpdatedEventSchema);

      if (data) {
        onMode(data.mode);
      }
    });
    source.addEventListener("resync", () => onResync());

    return () => source.close();
  }, []);
}
