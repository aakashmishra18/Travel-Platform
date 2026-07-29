const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

/**
 * Verifies the caller's access token. user-service trusts tokens signed
 * by auth-service — it does NOT issue or refresh tokens itself, it only
 * reads `sub` (the user id) out of an already-valid token to know whose
 * data is being requested.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(ApiError.unauthorized("Missing or malformed Authorization header"));
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret, {
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    });
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

module.exports = requireAuth;
