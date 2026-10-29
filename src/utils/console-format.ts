import { DISPLAY_TIME_ZONE } from "@/constants/console";
import type { AvatarToneProps, ConsoleLabelProps, ConsoleLabelViewProps } from "@/models/console";

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;
const DAY_COUNT_PER_STEP = 1;
const HASH_MULTIPLIER = 31;

const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
});
const dayFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
});
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: DISPLAY_TIME_ZONE });

const dayKeyOf = (date: Date): string => dayKeyFormat.format(date);

export const timeLabelOf = (iso: string, now: Date): string => {
  const date = new Date(iso);

  if (now.getTime() - date.getTime() < MS_PER_MINUTE) {
    return "agora";
  }

  if (dayKeyOf(date) === dayKeyOf(now)) {
    return timeFormat.format(date);
  }

  const yesterday = new Date(now.getTime() - DAY_COUNT_PER_STEP * MS_PER_DAY);

  return dayKeyOf(date) === dayKeyOf(yesterday) ? "ontem" : dayFormat.format(date);
};

const contactTextOf = (contactDueAt: string | null, now: Date | null): string | null => {
  if (contactDueAt === null || now === null) {
    return null;
  }

  const minutes = Math.ceil((new Date(contactDueAt).getTime() - now.getTime()) / MS_PER_MINUTE);

  return minutes > 0 ? `contato em ${minutes} min` : "contato vencido";
};

const transferredViewOf = (
  { ticketNumber, contactDueAt }: Extract<ConsoleLabelProps, { kind: "transferred" }>,
  now: Date | null,
): ConsoleLabelViewProps => {
  const detail = ticketNumber ?? contactTextOf(contactDueAt, now);

  return { text: detail ? `Transferida · ${detail}` : "Transferida", tone: "warning" };
};

export const labelViewOf = (label: ConsoleLabelProps, now: Date | null): ConsoleLabelViewProps => {
  switch (label.kind) {
    case "transferred":
      return transferredViewOf(label, now);
    case "agent_asked_help":
      return { text: `Agent pediu ajuda · confiança ${label.confidence}%`, tone: "danger" };
    case "agent_active":
      return { text: "Agent atendendo", tone: "neutral" };
    case "resolved_by_agent":
      return { text: "Resolvida pelo agent", tone: "success" };
    case "closed":
      return { text: "Encerrada", tone: "neutral" };
    case "mine":
      return { text: "Você está atendendo", tone: "info" };
    case "with_other":
      return { text: `Com ${label.analystName}`, tone: "violet" };
  }
};

const AVATAR_TONES: readonly AvatarToneProps[] = [
  { background: "bg-primary-soft", text: "text-primary-text" },
  { background: "bg-success-soft", text: "text-success-text" },
  { background: "bg-warning-soft", text: "text-warning-text" },
  { background: "bg-violet-soft", text: "text-violet-text" },
  { background: "bg-danger-soft", text: "text-danger-text" },
];

export const avatarToneOf = (seed: string): AvatarToneProps => {
  const hash = [...seed].reduce((total, char) => total * HASH_MULTIPLIER + char.charCodeAt(0), 0);

  return (
    AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length] ??
    AVATAR_TONES[0] ?? {
      background: "bg-card",
      text: "text-ink-2",
    }
  );
};

export const clockTimeOf = (iso: string): string => timeFormat.format(new Date(iso));

export const dayKeyOfIso = (iso: string): string => dayKeyOf(new Date(iso));

export const dayLabelOf = (iso: string, now: Date): string => {
  const date = new Date(iso);
  const yesterday = new Date(now.getTime() - DAY_COUNT_PER_STEP * MS_PER_DAY);

  if (dayKeyOf(date) === dayKeyOf(now)) {
    return "Hoje";
  }

  return dayKeyOf(date) === dayKeyOf(yesterday) ? "Ontem" : dayFormat.format(date);
};
