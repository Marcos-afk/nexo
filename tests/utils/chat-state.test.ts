import { describe, expect, it } from "vitest";
import {
  COMPOSER_PLACEHOLDER,
  DEGRADED_NOTICE,
  LIMIT_NOTICE,
  LIMIT_PLACEHOLDER,
  MODE_NOTICES,
  OFFLINE_NOTICE,
  OFFLINE_PLACEHOLDER,
} from "../../src/constants/chat";
import { counterOf, isComposerDisabled, noticeOf, placeholderOf } from "../../src/utils/chat-state";

const LIMIT = 30;

describe("counterOf", () => {
  it.each([
    { count: 0, tone: "info" },
    { count: 24, tone: "info" },
    { count: 25, tone: "warning" },
    { count: 29, tone: "warning" },
    { count: 30, tone: "danger" },
    { count: 31, tone: "danger" },
  ])("$count/30 is $tone", ({ count, tone }) => {
    expect(counterOf(count, LIMIT)).toEqual({
      text: `${count}/30 mensagens nesta sessão`,
      tone,
    });
  });
});

describe("noticeOf", () => {
  it.each([
    {
      name: "limit reached wins over everything",
      state: { isLimitReached: true, assistantStatus: "offline", mode: "with_analyst" },
      expected: { tone: "danger", text: LIMIT_NOTICE },
    },
    {
      name: "offline assistant",
      state: { isLimitReached: false, assistantStatus: "offline", mode: "agent" },
      expected: { tone: "danger", text: OFFLINE_NOTICE },
    },
    {
      name: "offline wins over the analyst mode",
      state: { isLimitReached: false, assistantStatus: "offline", mode: "awaiting_analyst" },
      expected: { tone: "danger", text: OFFLINE_NOTICE },
    },
    {
      name: "waiting for an analyst",
      state: { isLimitReached: false, assistantStatus: "online", mode: "awaiting_analyst" },
      expected: { tone: "info", text: MODE_NOTICES.awaiting_analyst },
    },
    {
      name: "with an analyst",
      state: { isLimitReached: false, assistantStatus: "degraded", mode: "with_analyst" },
      expected: { tone: "info", text: MODE_NOTICES.with_analyst },
    },
    {
      name: "ticket system unavailable",
      state: { isLimitReached: false, assistantStatus: "degraded", mode: "agent" },
      expected: { tone: "warning", text: DEGRADED_NOTICE },
    },
    {
      name: "everything fine",
      state: { isLimitReached: false, assistantStatus: "online", mode: "agent" },
      expected: null,
    },
    {
      name: "status still unknown",
      state: { isLimitReached: false, assistantStatus: null, mode: "agent" },
      expected: null,
    },
  ] as const)("$name", ({ state, expected }) => {
    expect(noticeOf(state)).toEqual(expected);
  });
});

describe("composer availability", () => {
  it.each([
    {
      name: "available",
      limit: false,
      status: "online",
      disabled: false,
      placeholder: COMPOSER_PLACEHOLDER,
    },
    {
      name: "degraded still available",
      limit: false,
      status: "degraded",
      disabled: false,
      placeholder: COMPOSER_PLACEHOLDER,
    },
    {
      name: "unknown status still available",
      limit: false,
      status: null,
      disabled: false,
      placeholder: COMPOSER_PLACEHOLDER,
    },
    {
      name: "offline",
      limit: false,
      status: "offline",
      disabled: true,
      placeholder: OFFLINE_PLACEHOLDER,
    },
    {
      name: "limit reached",
      limit: true,
      status: "online",
      disabled: true,
      placeholder: LIMIT_PLACEHOLDER,
    },
  ] as const)("$name", ({ limit, status, disabled, placeholder }) => {
    const state = { isLimitReached: limit, assistantStatus: status };

    expect(isComposerDisabled(state)).toBe(disabled);
    expect(placeholderOf(state)).toBe(placeholder);
  });
});
