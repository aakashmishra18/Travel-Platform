const env = require("../config/env");
const ApiError = require("../utils/ApiError");

/**
 * supplier-service is purely an internal integration layer — it has no
 * end-user-facing routes at all (unlike auth/user/search-service). Only
 * other services (search-service, later booking-service) should ever
 * reach it, and only through this shared secret. There is no JWT check
 * here because no end-user token ever needs to pass through this
 * service — the caller IS the client, not a user acting through it.
 */
function verifyInternalCaller(req, res, next) {
  const provided = req.headers["x-internal-service-token"];
  if (provided !== env.internalServiceToken) {
    return next(ApiError.forbidden("Direct access to this service is not permitted"));
  }
  next();
}

module.exports = verifyInternalCaller;
