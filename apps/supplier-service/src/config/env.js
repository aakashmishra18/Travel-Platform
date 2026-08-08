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
  serviceName: process.env.SERVICE_NAME || 'supplier-service',
  port: parseInt(process.env.PORT || '3004', 10),

  db: {
    connectionString: required('DATABASE_URL'),
    poolMax: parseInt(process.env.PG_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
  },

  // This service is internal-only — no end-user JWTs pass through it,
  // only other services (search-service, later booking-service). No
  // JWT_ACCESS_SECRET needed here at all.
  internalServiceToken: required('INTERNAL_SERVICE_TOKEN'),

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10),
  },

  offerTtlMinutes: parseInt(process.env.OFFER_TTL_MINUTES || '15', 10),

  // -----------------------------------------------------------------
  // Provider credentials — ALL optional. The Mock provider is always
  // registered regardless of what's set below; Duffel/Amadeus only
  // activate once their respective keys are present. See
  // src/providers/providerRegistry.js for the activation logic.
  // -----------------------------------------------------------------
  duffel: {
    apiKey: process.env.DUFFEL_API_KEY || null,
    apiUrl: process.env.DUFFEL_API_URL || 'https://api.duffel.com',
    apiVersion: process.env.DUFFEL_API_VERSION || 'v2',
  },

  amadeus: {
    apiKey: process.env.AMADEUS_API_KEY || null,
    apiSecret: process.env.AMADEUS_API_SECRET || null,
    apiUrl: process.env.AMADEUS_API_URL || 'https://test.api.amadeus.com',
  },

  // Outbound rate limits — how hard this service is allowed to hit
  // each provider's API per minute. Real providers enforce their own
  // limits server-side; this is a client-side throttle so we fail
  // fast/queue locally rather than getting 429'd repeatedly.
  providerRateLimits: {
    duffelPerMinute: parseInt(process.env.DUFFEL_RATE_LIMIT_PER_MIN || '60', 10),
    amadeusPerMinute: parseInt(process.env.AMADEUS_RATE_LIMIT_PER_MIN || '60', 10),
  },

  retry: {
    maxAttempts: parseInt(process.env.PROVIDER_RETRY_MAX_ATTEMPTS || '3', 10),
    baseDelayMs: parseInt(process.env.PROVIDER_RETRY_BASE_DELAY_MS || '300', 10),
  },
};

module.exports = env;
