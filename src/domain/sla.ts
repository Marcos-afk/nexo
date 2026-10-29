export const ticketPriorities = ["critical", "high", "medium", "low"] as const;

export type TicketPriority = (typeof ticketPriorities)[number];

const MS_PER_HOUR = 3_600_000;
const HOURS_PER_DAY = 24;
const OFFICE_UTC_OFFSET_HOURS = -3;
const OFFICE_OPENING_HOUR = 8;
const OFFICE_CLOSING_HOUR = 18;
const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;
const OFFICE_UTC_OFFSET_MS = OFFICE_UTC_OFFSET_HOURS * MS_PER_HOUR;
const OFFICE_OPENING_MS = OFFICE_OPENING_HOUR * MS_PER_HOUR;
const OFFICE_CLOSING_MS = OFFICE_CLOSING_HOUR * MS_PER_HOUR;
const SUNDAY = 0;
const SATURDAY = 6;
const CRITICAL_RESPONSE_HOURS = 1;
const HIGH_RESPONSE_BUSINESS_HOURS = 4;
const MEDIUM_RESPONSE_BUSINESS_DAYS = 3;
const LOW_RESPONSE_BUSINESS_DAYS = 5;

const startOfDay = (wallClockMs: number): number =>
  Math.floor(wallClockMs / MS_PER_DAY) * MS_PER_DAY;

const isBusinessDay = (dayStartMs: number): boolean => {
  const weekday = new Date(dayStartMs).getUTCDay();

  return weekday !== SUNDAY && weekday !== SATURDAY;
};

const nextBusinessDayStart = (dayStartMs: number): number => {
  const candidate = dayStartMs + MS_PER_DAY;

  return isBusinessDay(candidate) ? candidate : nextBusinessDayStart(candidate);
};

const alignToBusinessHours = (wallClockMs: number): number => {
  const dayStartMs = startOfDay(wallClockMs);

  if (!isBusinessDay(dayStartMs)) {
    return alignToBusinessHours(dayStartMs + MS_PER_DAY);
  }

  if (wallClockMs < dayStartMs + OFFICE_OPENING_MS) {
    return dayStartMs + OFFICE_OPENING_MS;
  }

  if (wallClockMs < dayStartMs + OFFICE_CLOSING_MS) {
    return wallClockMs;
  }

  return alignToBusinessHours(dayStartMs + MS_PER_DAY);
};

const addBusinessMs = (wallClockMs: number, remainingMs: number): number => {
  const startMs = alignToBusinessHours(wallClockMs);
  const dayStartMs = startOfDay(startMs);
  const availableMs = dayStartMs + OFFICE_CLOSING_MS - startMs;

  if (remainingMs <= availableMs) {
    return startMs + remainingMs;
  }

  return addBusinessMs(dayStartMs + MS_PER_DAY, remainingMs - availableMs);
};

const addBusinessDays = (wallClockMs: number, days: number): number => {
  const startMs = alignToBusinessHours(wallClockMs);

  if (days === 0) {
    return startMs;
  }

  const timeOfDayMs = startMs - startOfDay(startMs);

  return addBusinessDays(nextBusinessDayStart(startOfDay(startMs)) + timeOfDayMs, days - 1);
};

const dueAtByPriority = {
  critical: (wallClockMs) => wallClockMs + CRITICAL_RESPONSE_HOURS * MS_PER_HOUR,
  high: (wallClockMs) => addBusinessMs(wallClockMs, HIGH_RESPONSE_BUSINESS_HOURS * MS_PER_HOUR),
  medium: (wallClockMs) => addBusinessDays(wallClockMs, MEDIUM_RESPONSE_BUSINESS_DAYS),
  low: (wallClockMs) => addBusinessDays(wallClockMs, LOW_RESPONSE_BUSINESS_DAYS),
} as const satisfies Record<TicketPriority, (wallClockMs: number) => number>;

export const computeDueAt = (priority: TicketPriority, createdAt: Date): Date => {
  const createdAtWallClockMs = createdAt.getTime() + OFFICE_UTC_OFFSET_MS;
  const dueAtWallClockMs = dueAtByPriority[priority](createdAtWallClockMs);

  return new Date(dueAtWallClockMs - OFFICE_UTC_OFFSET_MS);
};

export const handoffUrgencies = ["urgent", "normal"] as const;

export type HandoffUrgency = (typeof handoffUrgencies)[number];

const MS_PER_MINUTE = 60_000;
const URGENT_CONTACT_MINUTES = 30;
const NORMAL_CONTACT_BUSINESS_HOURS = 2;

const contactDueAtByUrgency = {
  urgent: (wallClockMs) => wallClockMs + URGENT_CONTACT_MINUTES * MS_PER_MINUTE,
  normal: (wallClockMs) => addBusinessMs(wallClockMs, NORMAL_CONTACT_BUSINESS_HOURS * MS_PER_HOUR),
} as const satisfies Record<HandoffUrgency, (wallClockMs: number) => number>;

export const computeContactDueAt = (urgency: HandoffUrgency, transferredAt: Date): Date => {
  const transferredAtWallClockMs = transferredAt.getTime() + OFFICE_UTC_OFFSET_MS;
  const dueAtWallClockMs = contactDueAtByUrgency[urgency](transferredAtWallClockMs);

  return new Date(dueAtWallClockMs - OFFICE_UTC_OFFSET_MS);
};

export const isOverdue = (dueAt: Date, now: Date): boolean => now.getTime() > dueAt.getTime();

const TWO_DIGITS = 2;

const twoDigits = (value: number): string => String(value).padStart(TWO_DIGITS, "0");

const OFFICE_DATE_TIME_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4}) às (\d{2}):(\d{2})$/;

export const parseOfficeDateTime = (text: string): Date | null => {
  const match = OFFICE_DATE_TIME_PATTERN.exec(text);

  if (!match) {
    return null;
  }

  const [day, month, year, hours, minutes] = match.slice(1).map(Number);
  const wallClockMs = Date.UTC(year ?? 0, (month ?? 1) - 1, day, hours, minutes);

  return new Date(wallClockMs - OFFICE_UTC_OFFSET_MS);
};

export const formatOfficeDateTime = (date: Date): string => {
  const local = new Date(date.getTime() + OFFICE_UTC_OFFSET_MS);
  const day = `${twoDigits(local.getUTCDate())}/${twoDigits(local.getUTCMonth() + 1)}/${local.getUTCFullYear()}`;

  return `${day} às ${twoDigits(local.getUTCHours())}:${twoDigits(local.getUTCMinutes())}`;
};
