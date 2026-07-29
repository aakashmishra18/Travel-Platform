require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  serviceName: process.env.SERVICE_NAME || "user-service",
  port: Number(process.env.PORT) || 3002,

  databaseUrl: process.env.DATABASE_URL,
  pgPoolMax: Number(process.env.PG_POOL_MAX) || 10,
  pgIdleTimeoutMs: Number(process.env.PG_IDLE_TIMEOUT_MS) || 30000,

  // Must match auth-service's JWT_ACCESS_SECRET exactly — this service
  // verifies the same access tokens locally, it does not issue its own.
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    issuer: process.env.JWT_ISSUER || "travel-os-auth-service",
    audience: process.env.JWT_AUDIENCE || "travel-os-internal",
  },

  // Same shared secret used by api-gateway <-> auth-service, reused here
  // so the gateway can call user-service's internal routes too.
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || null,

  // Symmetric key used to encrypt sensitive document fields (passport
  // numbers etc.) at rest via pgcrypto. Must be kept secret and backed
  // up separately from the database itself — losing it makes existing
  // encrypted documents unrecoverable.
  documentEncryptionKey: process.env.DOCUMENT_ENCRYPTION_KEY,

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 120,
  },

  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

module.exports = env;
