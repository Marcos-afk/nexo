import type { UIMessage } from "ai";

const TEXT_PART_TYPE = "text";

export const messageTextOf = (message: UIMessage): string =>
  message.parts.map((part) => (part.type === TEXT_PART_TYPE ? part.text : "")).join("");
