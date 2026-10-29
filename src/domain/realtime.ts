import type { ConversationMode, MessageAuthorKind } from "./conversation";
import type { EmployeeRole } from "./employee";

interface RealtimeEventBase {
  readonly conversationId: string;
  readonly ownerId: string;
  readonly at: string;
}

export interface MessageCreatedEvent extends RealtimeEventBase {
  readonly type: "message.created";
  readonly messageId: string;
  readonly authorKind: MessageAuthorKind;
}

export interface ConversationUpdatedEvent extends RealtimeEventBase {
  readonly type: "conversation.updated";
  readonly mode: ConversationMode;
  readonly assignedAnalystId: string | null;
}

export interface PresenceChangedEvent {
  readonly type: "presence.changed";
  readonly ownerId: string;
  readonly online: boolean;
  readonly at: string;
}

export type RealtimeEvent = MessageCreatedEvent | ConversationUpdatedEvent | PresenceChangedEvent;

export interface EventPublisher {
  readonly publish: (event: RealtimeEvent) => void;
}

export interface EventAudience {
  readonly id: string;
  readonly role: EmployeeRole;
}

export const silentPublisher: EventPublisher = { publish: () => undefined };

export const isVisibleTo = (event: RealtimeEvent, audience: EventAudience): boolean =>
  audience.role === "analyst" || event.ownerId === audience.id;
