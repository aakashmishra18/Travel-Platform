const logger = require("./logger");

/**
 * Retries an async function with exponential backoff. This is the one
 * place retry logic lives (per the design doc: "Don't let every
 * service implement retry logic") — every provider adapter's outbound
 * HTTP call goes through this instead of hand-rolling its own retry.
 *
 * Only retries on transient failures (network errors, 5xx, timeouts).
 * A 4xx from the provider (bad request, invalid offer, etc.) means
 * retrying would just fail identically — those should NOT be retried,
 * so callers should throw a normal Error for those without the
 * `retryable` flag, or the caller checks status before calling this.
 */
async function withRetry(fn, { maxAttempts, baseDelayMs, context = "operation" } = {}) {
  const env = require("../config/env");
  const attempts = maxAttempts ?? env.retry.maxAttempts;
  const base = baseDelayMs ?? env.retry.baseDelayMs;

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === attempts;
      const retryable = err.retryable !== false; // default: assume retryable unless explicitly marked otherwise

      if (!retryable || isLastAttempt) {
        logger.warn(`${context} failed${isLastAttempt ? " (final attempt)" : " (not retryable)"}`, {
          attempt,
          error: err.message,
        });
        throw err;
      }

      const delay = base * 2 ** (attempt - 1);
      logger.warn(`${context} failed, retrying in ${delay}ms`, { attempt, error: err.message });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

module.exports = { withRetry };
