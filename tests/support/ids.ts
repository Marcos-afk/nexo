import type { IdGenerator } from "@/lib/ids";

export const createSequentialIds = (prefix: string): IdGenerator => {
  const counter = { value: 0 };

  return {
    next: () => {
      counter.value += 1;

      return `${prefix}-${counter.value}`;
    },
  };
};
