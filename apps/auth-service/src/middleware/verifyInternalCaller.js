const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * auth-service listens only on the internal network and should never be
 * reachable directly from the public internet. This middleware adds a
 * defense-in-depth check: only the API Gateway (holder of the shared
 * INTERNAL_SERVICE_TOKEN) may call these routes. Network policy /
 * service mesh mTLS should be the primary control in production; this
 * is a second layer, not a replacement for it.
 */
function verifyInternalCaller(req, res, next) {
  if (!env.internalServiceToken) {
    // Not configured (e.g. local dev) - skip the check but warn loudly.
    logger.warn('INTERNAL_SERVICE_TOKEN not set; internal-caller check is disabled');
    return next();
  }

  const provided = req.headers['x-internal-service-token'];
  if (provided !== env.internalServiceToken) {
    return next(ApiError.forbidden('Direct access to this service is not permitted'));
  }
  next();
}

module.exports = verifyInternalCaller;