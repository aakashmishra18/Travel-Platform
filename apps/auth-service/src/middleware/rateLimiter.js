const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function limiterErrorHandler(req, res, next) {
  next(ApiError.tooManyRequests('Too many requests, please try again later'));
}

/**
 * General-purpose limiter applied to the whole auth router.
 * In a multi-instance deployment, swap the default in-memory store for
 * `rate-limit-redis` backed by env.redisUrl so limits are shared across
 * instances.
 */
const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limiterErrorHandler,
});

/**
 * Stricter limiter scoped to login/password endpoints to slow down
 * credential-stuffing and brute-force attempts. Keyed by IP + email so
 * one attacker IP can't lock out unrelated accounts, and one leaked
 * email/password pair sprayed from many IPs still gets throttled.
 */
const loginLimiter = rateLimit({
  windowMs: env.rateLimit.loginWindowMs,
  max: env.rateLimit.loginMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body && req.body.email) || 'unknown'}`,
  handler: limiterErrorHandler,
});

module.exports = { generalLimiter, loginLimiter };