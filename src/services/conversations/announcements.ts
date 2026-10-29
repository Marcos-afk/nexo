import type { EventPublisher } from "../../domain/realtime";
import type { Clock } from "../../lib/clock";
import type { Conversation, Message } from "./conversation-service";

interface AnnouncementDeps {
  readonly clock: Clock;
  readonly events?: EventPublisher;
}

export const announceMessage = (
  { clock, events }: AnnouncementDeps,
  ownerId: string,
  message: Message,
): void => {
  events?.publish({
    type: "message.created",
    conversationId: message.conversationId,
    ownerId,
    at: clock.now().toISOString(),
    messageId: message.id,
    authorKind: message.authorKind,
  });
};

export const announceConversation = (
  { clock, events }: AnnouncementDeps,
  conversation: Conversation,
): void => {
  events?.publish({
    type: "conversation.updated",
    conversationId: conversation.id,
    ownerId: conversation.employeeId,
    at: clock.now().toISOString(),
    mode: conversation.mode,
    assignedAnalystId: conversation.assignedAnalystId,
  });
};
