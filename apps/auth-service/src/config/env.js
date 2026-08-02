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
  serviceName: process.env.SERVICE_NAME || 'auth-service',
  port: parseInt(process.env.PORT || '3001', 10),

  db: {
    connectionString: required('DATABASE_URL'),
    poolMax: parseInt(process.env.PG_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
  },

  redisUrl: process.env.REDIS_URL || null,

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'travel-os-auth-service',
    audience: process.env.JWT_AUDIENCE || 'travel-os-internal',
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),

  lockout: {
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10),
    durationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
  },

  tokenTtl: {
    emailVerificationMinutes: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MIN || '1440', 10),
    passwordResetMinutes: parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MIN || '30', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000', 10),
    loginMaxRequests: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },

  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || null,

 email: {
    from: process.env.EMAIL_FROM || 'Travel OS <no-reply@mishraaakash623@gmail.com>',
    gmailUser: process.env.GMAIL_USER || null,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD || null,
  },
};

module.exports = env;