const logger = require("../utils/logger");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error("Unhandled error", { error: err.message, stack: err.stack, requestId: req.id });

  if (res.headersSent) return next(err);

  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.statusCode ? err.message : "Something went wrong. Please try again later.",
      details: err.details,
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
