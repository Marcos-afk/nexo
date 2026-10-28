export interface IdGenerator {
  readonly next: () => string;
}

export const uuidGenerator: IdGenerator = { next: () => crypto.randomUUID() };
