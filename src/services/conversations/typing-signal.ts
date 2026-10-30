import { type ConversationServiceDeps, getActiveConversation } from "./conversation-service";

export const TYPING_THROTTLE_MS = 2000;

export interface TypingSignal {
  readonly signal: (ownerId: string) => Promise<void>;
}

export const createTypingSignal = (deps: ConversationServiceDeps): TypingSignal => {
  const lastSignalAt = new Map<string, number>();

  const signal = async (ownerId: string): Promise<void> => {
    const nowMs = deps.clock.now().getTime();
    const last = lastSignalAt.get(ownerId);

    if (last !== undefined && nowMs - last < TYPING_THROTTLE_MS) {
      return;
    }

    lastSignalAt.set(ownerId, nowMs);

    const conversation = await getActiveConversation(deps, ownerId);

    if (!conversation) {
      return;
    }

    deps.events?.publish({
      type: "typing.started",
      conversationId: conversation.id,
      ownerId,
      at: deps.clock.now().toISOString(),
    });
  };

  return { signal };
};
