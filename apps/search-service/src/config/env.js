require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'search-service',
  port: parseInt(process.env.PORT || '3003', 10),

  db: {
    connectionString: required('DATABASE_URL'),
    poolMax: parseInt(process.env.PG_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
  },

  // Optional — search-service runs fully without Redis, just without
  // result caching. Unlike JWT_ACCESS_SECRET/DATABASE_URL below, this
  // deliberately does NOT use required() — there's no safe default for
  // a missing secret, but there IS a safe default for "no cache".
  redisUrl: process.env.REDIS_URL || null,
  searchCacheTtlSeconds: parseInt(process.env.SEARCH_CACHE_TTL_SECONDS || '120', 10),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    issuer: process.env.JWT_ISSUER || 'travel-os-auth-service',
    audience: process.env.JWT_AUDIENCE || 'travel-os-internal',
  },

  internalServiceToken: required('INTERNAL_SERVICE_TOKEN'),

  // supplier-service is now the actual source of flight data — see
  // src/services/supplierClient.js. Required: without it, search has
  // no provider to call at all, so failing fast at boot is correct
  // here rather than discovering it on the first search request.
  supplierServiceUrl: required('SUPPLIER_SERVICE_URL', 'http://localhost:3004'),

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '180', 10),
  },

  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

module.exports = env;
