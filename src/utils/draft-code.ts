const CODE_PATTERN = /^D-\d+$/;
const CODE_LENGTH = 4;

export const draftCodeOf = (id: string): string =>
  CODE_PATTERN.test(id) ? id : `D-${id.slice(0, CODE_LENGTH).toUpperCase()}`;
