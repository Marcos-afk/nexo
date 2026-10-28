import type { Clock } from "./clock";

export const logLevels = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof logLevels)[number];
export type LogFields = Readonly<Record<string, unknown>>;

export interface Logger {
  readonly debug: (fields: LogFields, message: string) => void;
  readonly info: (fields: LogFields, message: string) => void;
  readonly warn: (fields: LogFields, message: string) => void;
  readonly error: (fields: LogFields, message: string) => void;
  readonly child: (bindings: LogFields) => Logger;
}

export interface LoggerOptions {
  readonly level: LogLevel;
  readonly clock: Clock;
  readonly write: (line: string) => void;
  readonly bindings?: LogFields;
}

const levelPriority = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const satisfies Record<LogLevel, number>;

const REDACTED_VALUE = "[REDACTED]";
const SENSITIVE_KEY_PATTERN = /password|secret|token|authorization|api[-_]?key|cookie/i;

const serializeValue = (value: unknown): unknown =>
  value instanceof Error ? { name: value.name, message: value.message } : value;

const sanitizeFields = (fields: LogFields): LogFields =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? REDACTED_VALUE : serializeValue(value),
    ]),
  );

export const createLogger = (options: LoggerOptions): Logger => {
  const bindings = options.bindings ?? {};

  const emit = (level: LogLevel, fields: LogFields, message: string): void => {
    if (levelPriority[level] < levelPriority[options.level]) {
      return;
    }

    const entry = {
      level,
      time: options.clock.now().toISOString(),
      message,
      ...sanitizeFields(bindings),
      ...sanitizeFields(fields),
    };

    options.write(JSON.stringify(entry));
  };

  return {
    debug: (fields, message) => emit("debug", fields, message),
    info: (fields, message) => emit("info", fields, message),
    warn: (fields, message) => emit("warn", fields, message),
    error: (fields, message) => emit("error", fields, message),
    child: (childBindings) =>
      createLogger({ ...options, bindings: { ...bindings, ...childBindings } }),
  };
};

export const stdoutWrite = (line: string): void => {
  process.stdout.write(`${line}\n`);
};
