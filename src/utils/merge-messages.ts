import type { UIMessage } from "ai";
import type { MessageAuthorKind } from "@/domain/conversation";
import { authorKindOf } from "@/utils/chat-lines";

const EXTERNAL_AUTHOR_KINDS: ReadonlySet<MessageAuthorKind> = new Set(["analyst", "system"]);

export const mergeExternalMessages = (
  local: readonly UIMessage[],
  server: readonly UIMessage[],
): UIMessage[] => {
  const known = new Set(local.map((message) => message.id));
  const added = server.filter(
    (message) => !known.has(message.id) && EXTERNAL_AUTHOR_KINDS.has(authorKindOf(message)),
  );

  return [...local, ...added];
};
