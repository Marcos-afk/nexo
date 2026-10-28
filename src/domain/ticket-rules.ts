import type { TicketStatus, TicketType } from "./ticket";

export const REOPEN_WINDOW_DAYS = 7;

const MS_PER_DAY = 86_400_000;

const prefixByType = {
  incident: "INC",
  request: "REQ",
} as const satisfies Record<TicketType, string>;

export const isClosed = (status: TicketStatus): boolean => status === "resolved";

export const isReopenable = (resolvedAt: Date, now: Date): boolean =>
  now.getTime() - resolvedAt.getTime() <= REOPEN_WINDOW_DAYS * MS_PER_DAY;

export const formatTicketNumber = (type: TicketType, sequence: number): string =>
  `${prefixByType[type]}-${sequence}`;

export const ticketNumberPrefix = (type: TicketType): string => prefixByType[type];
