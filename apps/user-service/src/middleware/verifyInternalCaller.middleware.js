const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

/**
 * Same pattern as auth-service: user-service should only be reachable
 * from the API Gateway, never directly from the public internet. This
 * is defense-in-depth alongside network policy / service mesh mTLS.
 */
function verifyInternalCaller(req, res, next) {
  if (!env.internalServiceToken) {
    logger.warn("INTERNAL_SERVICE_TOKEN not set; internal-caller check is disabled");
    return next();
  }

  const provided = req.headers["x-internal-service-token"];
  if (provided !== env.internalServiceToken) {
    return next(ApiError.forbidden("Direct access to this service is not permitted"));
  }
  next();
}

module.exports = verifyInternalCaller;
