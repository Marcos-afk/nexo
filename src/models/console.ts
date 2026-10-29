import type { ConsoleDto, ConsoleItemDto, ConsoleLabelDto } from "@/app/api/dto";

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
