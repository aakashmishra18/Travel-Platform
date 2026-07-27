const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const rateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: { code: "TOO_MANY_REQUESTS", message: "Too many requests, please slow down" },
      requestId: req.id,
    });
  },
});

module.exports = rateLimiter;