import { describe, expect, it } from "vitest";
import { computeDueAt, isOverdue, type TicketPriority } from "./sla";

interface DueAtCase {
  readonly name: string;
  readonly priority: TicketPriority;
  readonly createdAt: string;
  readonly dueAt: string;
}

const dueAtCases: readonly DueAtCase[] = [
  {
    name: "critical counts one clock hour",
    priority: "critical",
    createdAt: "2026-10-28T09:43:00-03:00",
    dueAt: "2026-10-28T10:43:00-03:00",
  },
  {
    name: "critical ignores weekends and office hours",
    priority: "critical",
    createdAt: "2026-10-31T23:30:00-03:00",
    dueAt: "2026-11-01T00:30:00-03:00",
  },
  {
    name: "high adds four business hours inside the day",
    priority: "high",
    createdAt: "2026-10-28T09:43:00-03:00",
    dueAt: "2026-10-28T13:43:00-03:00",
  },
  {
    name: "high ending exactly at closing time stays on the same day",
    priority: "high",
    createdAt: "2026-10-28T14:00:00-03:00",
    dueAt: "2026-10-28T18:00:00-03:00",
  },
  {
    name: "high carries the remainder to the next morning",
    priority: "high",
    createdAt: "2026-10-28T16:00:00-03:00",
    dueAt: "2026-10-29T10:00:00-03:00",
  },
  {
    name: "high skips the weekend",
    priority: "high",
    createdAt: "2026-10-30T17:00:00-03:00",
    dueAt: "2026-11-02T11:00:00-03:00",
  },
  {
    name: "high created on Saturday starts on Monday opening",
    priority: "high",
    createdAt: "2026-10-31T10:00:00-03:00",
    dueAt: "2026-11-02T12:00:00-03:00",
  },
  {
    name: "high created before opening starts at 08:00",
    priority: "high",
    createdAt: "2026-10-28T07:00:00-03:00",
    dueAt: "2026-10-28T12:00:00-03:00",
  },
  {
    name: "high created at closing time starts next morning",
    priority: "high",
    createdAt: "2026-10-28T18:00:00-03:00",
    dueAt: "2026-10-29T12:00:00-03:00",
  },
  {
    name: "medium adds three business days (INC-20311)",
    priority: "medium",
    createdAt: "2026-10-16T14:20:00-03:00",
    dueAt: "2026-10-21T14:20:00-03:00",
  },
  {
    name: "medium skips the weekend",
    priority: "medium",
    createdAt: "2026-10-28T09:00:00-03:00",
    dueAt: "2026-11-02T09:00:00-03:00",
  },
  {
    name: "medium created on Saturday counts from Monday opening",
    priority: "medium",
    createdAt: "2026-10-31T10:00:00-03:00",
    dueAt: "2026-11-05T08:00:00-03:00",
  },
  {
    name: "low adds five business days",
    priority: "low",
    createdAt: "2026-10-28T09:43:00-03:00",
    dueAt: "2026-11-04T09:43:00-03:00",
  },
];

describe("computeDueAt", () => {
  it.each(dueAtCases)("$name", ({ priority, createdAt, dueAt }) => {
    const result = computeDueAt(priority, new Date(createdAt));

    expect(result.toISOString()).toBe(new Date(dueAt).toISOString());
  });
});

interface OverdueCase {
  readonly name: string;
  readonly dueAt: string;
  readonly now: string;
  readonly expected: boolean;
}

const overdueCases: readonly OverdueCase[] = [
  {
    name: "INC-20311 opened on 16 Oct is overdue on 28 Oct",
    dueAt: "2026-10-21T14:20:00-03:00",
    now: "2026-10-28T09:43:00-03:00",
    expected: true,
  },
  {
    name: "exactly at the deadline is not overdue yet",
    dueAt: "2026-10-28T13:43:00-03:00",
    now: "2026-10-28T13:43:00-03:00",
    expected: false,
  },
  {
    name: "one second after the deadline is overdue",
    dueAt: "2026-10-28T13:43:00-03:00",
    now: "2026-10-28T13:43:01-03:00",
    expected: true,
  },
  {
    name: "before the deadline is not overdue",
    dueAt: "2026-10-28T13:43:00-03:00",
    now: "2026-10-28T09:43:00-03:00",
    expected: false,
  },
];

describe("isOverdue", () => {
  it.each(overdueCases)("$name", ({ dueAt, now, expected }) => {
    expect(isOverdue(new Date(dueAt), new Date(now))).toBe(expected);
  });
});
