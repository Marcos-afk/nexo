const MONTH_ABBREVIATIONS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

const DAY_MONTH_PATTERN = /^(\d{2})\/(\d{2})\//;

export const shortDateOf = (formatted: string): string => {
  const match = DAY_MONTH_PATTERN.exec(formatted);
  const month = match?.[2] === undefined ? undefined : MONTH_ABBREVIATIONS[Number(match[2]) - 1];

  return match && month ? `${match[1]} ${month}` : formatted;
};
