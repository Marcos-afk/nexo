const MAX_ACRONYM_LETTERS = 2;

export const getUserAcronym = (name: string): string =>
  name
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, MAX_ACRONYM_LETTERS)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
