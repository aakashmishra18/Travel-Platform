const env = require("../config/env");
const ApiError = require("../utils/ApiError");

/**
 * search-service should only be reachable from the API Gateway, never
 * directly from the public internet. Defense-in-depth alongside
 * network policy / service mesh mTLS — not a replacement for it.
 *
 * env.internalServiceToken is validated with required() at startup, so
 * unlike earlier drafts of this middleware there's no "not configured,
 * skip the check" branch here — if it were missing, the service would
 * already have refused to boot.
 */
function verifyInternalCaller(req, res, next) {
  const provided = req.headers["x-internal-service-token"];
  if (provided !== env.internalServiceToken) {
    return next(ApiError.forbidden("Direct access to this service is not permitted"));
  }
  next();
}

module.exports = verifyInternalCaller;
