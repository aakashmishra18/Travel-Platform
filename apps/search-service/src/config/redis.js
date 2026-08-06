const env = require("./env");
const logger = require("../utils/logger");

/**
 * Optional cache layer. If REDIS_URL isn't set, every method below is
 * a safe no-op — search-service works fully without Redis, just
 * without result caching. This mirrors the internalServiceToken
 * pattern elsewhere: "configured -> enforced, unconfigured -> warn and
 * skip" rather than requiring infrastructure you may not have set up
 * yet just to run the service locally.
 */
let client = null;

if (env.redisUrl) {
  try {
    // Lazy require so a missing `redis` package doesn't break startup
    // for anyone who never configures REDIS_URL in the first place.
    const { createClient } = require("redis");
    client = createClient({ url: env.redisUrl });
    client.on("error", (err) => {
      logger.warn("Redis client error — falling back to no-cache behavior", { error: err.message });
      client = null;
    });
    client.connect().then(() => logger.info("Connected to Redis cache"));
  } catch (err) {
    logger.warn("Redis unavailable — running without search result caching", { error: err.message });
    client = null;
  }
} else {
  logger.info("REDIS_URL not set — running without search result caching");
}

const cache = {
  async get(key) {
    if (!client) return null;
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.warn("Redis get failed, treating as cache miss", { error: err.message });
      return null;
    }
  },

  async set(key, value, ttlSeconds) {
    if (!client) return;
    try {
      await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
      logger.warn("Redis set failed, continuing without caching this result", { error: err.message });
    }
  },
};

module.exports = cache;
