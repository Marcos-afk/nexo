export const conversationModes = ["agent", "awaiting_analyst", "with_analyst", "closed"] as const;
export const messageAuthorKinds = ["employee", "agent", "analyst", "system"] as const;
export const draftModes = ["create", "update", "reopen"] as const;
export const draftStatuses = ["pending", "confirmed", "cancelled"] as const;

export type ConversationMode = (typeof conversationModes)[number];
export type MessageAuthorKind = (typeof messageAuthorKinds)[number];
export type DraftMode = (typeof draftModes)[number];
export type DraftStatus = (typeof draftStatuses)[number];
