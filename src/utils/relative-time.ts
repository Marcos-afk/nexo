const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

const plural = (count: number, singular: string, pluralForm: string): string =>
  `${count} ${count === 1 ? singular : pluralForm}`;

export const formatRelativeTime = (from: Date, now: Date): string => {
  const minutes = Math.floor((now.getTime() - from.getTime()) / MS_PER_MINUTE);

  if (minutes < 1) {
    return "agora";
  }

  if (minutes < MINUTES_PER_HOUR) {
    return `há ${minutes} min`;
  }

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);

  if (hours < HOURS_PER_DAY) {
    return `há ${hours} h`;
  }

  return `há ${plural(Math.floor(hours / HOURS_PER_DAY), "dia", "dias")}`;
};
