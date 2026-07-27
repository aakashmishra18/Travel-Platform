const { randomUUID } = require('crypto');

/**
 * Attaches a request id (reusing the API Gateway's X-Request-Id when
 * present) so a single customer request can be traced across services.
 */
function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = requestId;