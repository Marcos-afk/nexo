const MS_PER_DAY = 86_400_000;
const NEVER_CHANGED_LABEL = "Sem registro de alteração da senha";

export const passwordAgeLabelOf = (changedAt: Date | null, now: Date): string => {
  if (changedAt === null) {
    return NEVER_CHANGED_LABEL;
  }

  const days = Math.max(0, Math.floor((now.getTime() - changedAt.getTime()) / MS_PER_DAY));

  if (days === 0) {
    return "Alterada hoje";
  }

  return `Alterada há ${days} ${days === 1 ? "dia" : "dias"}`;
};
