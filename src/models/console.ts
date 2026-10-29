import type {
  ConsoleConversationDto,
  ConsoleDto,
  ConsoleItemDto,
  ConsoleLabelDto,
  ConsoleMessageDto,
} from "@/app/api/dto";

export type ConsoleProps = ConsoleDto;
export type ConsoleItemProps = ConsoleItemDto;
export type ConsoleLabelProps = ConsoleLabelDto;
export type ConsoleCountsProps = ConsoleDto["counts"];
export type ConsoleMeProps = ConsoleDto["me"];

export interface ConsoleLabelViewProps {
  readonly text: string;
  readonly tone: "neutral" | "info" | "success" | "warning" | "danger" | "violet";
}

export interface AvatarToneProps {
  readonly background: string;
  readonly text: string;
}

export type ConsoleConversationProps = ConsoleConversationDto;
export type ConsoleMessageProps = ConsoleMessageDto;

export type ConversationEntryType =
  | { readonly kind: "day"; readonly key: string; readonly label: string }
  | { readonly kind: "message"; readonly key: string; readonly message: ConsoleMessageDto };

export interface ConversationActionsProps {
  readonly isBusy: boolean;
  readonly onAssume: () => void;
  readonly onReturn: () => void;
  readonly onClose: () => void;
  readonly onReply: (content: string) => void;
}
