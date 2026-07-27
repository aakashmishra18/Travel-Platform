const { randomUUID } = require("crypto");

/**
 * Attaches a request id to every incoming request and echoes it back
 * in the response so a single call can be traced through auth-service
 * logs too (the proxy forwards this same id downstream).
 */
function requestId(req, res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}

module.exports = requestId;