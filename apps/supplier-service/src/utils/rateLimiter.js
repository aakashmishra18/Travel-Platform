const ApiError = require("./ApiError");

/**
 * A simple fixed-window counter per provider, tracking calls made TO
 * that provider's API (not incoming requests to us — that's handled
 * separately by middleware/rateLimit.middleware.js). Real providers
 * enforce their own server-side limits (e.g. "100 requests/minute");
 * this throttles our own outbound traffic so we fail fast locally with
 * a clear error instead of hammering the provider and getting 429'd
 * repeatedly, which would also count against retry attempts for no
 * reason.
 */
class ProviderRateLimiter {
  constructor() {
    this.windows = new Map(); // provider name -> { count, windowStart }
  }

  /**
   * Throws if the provider's per-minute budget is exhausted; otherwise
   * records this call and lets it through.
   */
  consume(providerName, maxPerMinute) {
    const now = Date.now();
    const windowMs = 60000;
    const entry = this.windows.get(providerName) || { count: 0, windowStart: now };

    if (now - entry.windowStart >= windowMs) {
      entry.count = 0;
      entry.windowStart = now;
    }

    if (entry.count >= maxPerMinute) {
      throw ApiError.serviceUnavailable(
        `Outbound rate limit reached for provider ${providerName} (${maxPerMinute}/min) — try again shortly`
      );
    }

    entry.count += 1;
    this.windows.set(providerName, entry);
  }
}

module.exports = new ProviderRateLimiter();
