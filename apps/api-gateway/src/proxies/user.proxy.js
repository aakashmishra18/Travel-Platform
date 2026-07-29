const { createProxyMiddleware } = require("http-proxy-middleware");
const env = require("../config/env");
const logger = require("../utils/logger");

const userProxy = createProxyMiddleware({
  target: env.services.user, // add USER_SERVICE_URL to gateway's env.js / .env, e.g. http://localhost:3002
  changeOrigin: true,
  proxyTimeout: env.proxyTimeoutMs,
  timeout: env.proxyTimeoutMs,
  pathRewrite: (path) => `/internal/v1/users${path}`,

  on: {
    proxyReq(proxyReq, req, res) {
      if (env.internalServiceToken) {
        proxyReq.setHeader("X-Internal-Service-Token", env.internalServiceToken);
      }
      if (req.id) {
        proxyReq.setHeader("X-Request-Id", req.id);
      }
      proxyReq.setHeader("X-Forwarded-For", req.headers["x-forwarded-for"] || req.ip);
      // The client's own Authorization header (their access token) is
      // forwarded automatically by the proxy — user-service verifies it
      // itself, the gateway doesn't need to check it again for these routes.
    },

    error(err, req, res) {
      logger.error("User service proxy error", { error: err.message, requestId: req.id });
      if (!res.headersSent) {
        res.status(502).json({
          error: { code: "BAD_GATEWAY", message: "User service is currently unavailable" },
          requestId: req.id,
        });
      }
    },
  },
});

module.exports = userProxy;