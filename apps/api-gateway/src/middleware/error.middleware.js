const logger = require("../utils/logger");

/**
 * Catches anything thrown/next(err)'d by routes that ISN'T already
 * handled by the proxy's own `on.error` (that one replies directly).
 * This mainly covers programmer errors in gateway-local code.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error("Unhandled gateway error", { error: err.message, stack: err.stack, requestId: req.id });

  if (res.headersSent) return next(err);

  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.statusCode ? err.message : "Something went wrong. Please try again later.",
    },
    requestId: req.id,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.originalUrl} not found` },
    requestId: req.id,
  });
}

module.exports = { errorHandler, notFoundHandler };