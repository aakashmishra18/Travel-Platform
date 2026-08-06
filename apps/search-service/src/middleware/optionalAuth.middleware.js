const jwt = require("jsonwebtoken");
const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * Unlike user-service's requireAuth, this NEVER rejects the request.
 * Flight search is a public feature — browsing doesn't require login.
 * If a valid Bearer token IS presented, req.user gets populated so
 * search_logs can be tied to an account (recent searches, price
 * alerts, etc. later). A missing or invalid token just means the
 * search proceeds as a guest — it's never an error condition here.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret, {
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    });
    req.user = { id: payload.sub, email: payload.email };
  } catch (err) {
    logger.debug("optionalAuth: token present but invalid, proceeding as guest", { error: err.message });
    req.user = null;
  }
  next();
}

module.exports = optionalAuth;
