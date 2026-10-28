export interface RetryAttempt {
  readonly attempt: number;
  readonly delayMs: number;
  readonly error: unknown;
}

export interface RetryOptions {
  readonly attempts: number;
  readonly baseDelayMs: number;
  readonly isRetryable: (error: unknown) => boolean;
  readonly sleep: (ms: number) => Promise<void>;
  readonly onRetry?: (retry: RetryAttempt) => void;
}

const BACKOFF_FACTOR = 2;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const retry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  attempt = 1,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (attempt >= options.attempts || !options.isRetryable(error)) {
      throw error;
    }

    const delayMs = options.baseDelayMs * BACKOFF_FACTOR ** (attempt - 1);

    options.onRetry?.({ attempt, delayMs, error });
    await options.sleep(delayMs);

    return retry(operation, options, attempt + 1);
  }
};
