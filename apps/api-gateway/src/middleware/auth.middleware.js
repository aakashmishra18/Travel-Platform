const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Verifies the client's access token at the edge, before proxying to
 * protected auth-service routes (/me, /logout, /sessions, etc). This
 * fails fast on a garbage/expired token instead of wasting a round
 * trip to auth-service - which still independently re-verifies the
 * same token when the request is forwarded, so there's no single
 * point of trust.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing or malformed Authorization header" },
      requestId: req.id,
    });
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret, {
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    });
    req.user = { id: payload.sub, email: payload.email, sessionId: payload.sid };
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired access token" },
      requestId: req.id,
    });
  }
}

module.exports = requireAuth;