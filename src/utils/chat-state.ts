import {
  COMPOSER_PLACEHOLDER,
  DEGRADED_NOTICE,
  LENGTH_WARNING_THRESHOLD,
  LIMIT_NOTICE,
  LIMIT_PLACEHOLDER,
  MESSAGE_LIMIT_WARNING_THRESHOLD,
  MODE_NOTICES,
  OFFLINE_NOTICE,
  OFFLINE_PLACEHOLDER,
} from "@/constants/chat";
import type { ConversationMode } from "@/domain/conversation";
import type { AssistantStatus } from "@/domain/health";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/domain/input-limits";
import type { ChatCounterProps, ChatNoticeProps, ChatNoticeToneType } from "@/models/chat";

export interface ChatStateProps {
  readonly isLimitReached: boolean;
  readonly assistantStatus: AssistantStatus | null;
  readonly mode: ConversationMode;
}

const counterToneOf = (count: number, limit: number): ChatNoticeToneType => {
  if (count >= limit) {
    return "danger";
  }

  return count >= MESSAGE_LIMIT_WARNING_THRESHOLD ? "warning" : "info";
};

export const counterOf = (count: number, limit: number): ChatCounterProps => ({
  text: `${count}/${limit} mensagens nesta sessão`,
  tone: counterToneOf(count, limit),
});

export const lengthCounterOf = (length: number): ChatCounterProps | null => {
  if (length < LENGTH_WARNING_THRESHOLD) {
    return null;
  }

  return {
    text: `${length}/${MAX_CHAT_MESSAGE_LENGTH} caracteres`,
    tone: length >= MAX_CHAT_MESSAGE_LENGTH ? "danger" : "warning",
  };
};

export const noticeOf = ({
  isLimitReached,
  assistantStatus,
  mode,
}: ChatStateProps): ChatNoticeProps | null => {
  const modeNotice = MODE_NOTICES[mode];

  if (isLimitReached && mode === "agent") {
    return { tone: "danger", text: LIMIT_NOTICE, action: "request-analyst" };
  }

  if (assistantStatus === "offline") {
    return { tone: "danger", text: OFFLINE_NOTICE };
  }

  if (modeNotice !== null) {
    return { tone: "info", text: modeNotice };
  }

  return assistantStatus === "degraded" ? { tone: "warning", text: DEGRADED_NOTICE } : null;
};

export const isComposerDisabled = ({
  isLimitReached,
  assistantStatus,
}: Pick<ChatStateProps, "isLimitReached" | "assistantStatus">): boolean =>
  isLimitReached || assistantStatus === "offline";

export const placeholderOf = ({
  isLimitReached,
  assistantStatus,
}: Pick<ChatStateProps, "isLimitReached" | "assistantStatus">): string => {
  if (isLimitReached) {
    return LIMIT_PLACEHOLDER;
  }

  return assistantStatus === "offline" ? OFFLINE_PLACEHOLDER : COMPOSER_PLACEHOLDER;
};
