const { createProxyMiddleware } = require("http-proxy-middleware");
const env = require("../config/env");
const logger = require("../utils/logger");

const searchProxy = createProxyMiddleware({
  target: env.services.search, // add SEARCH_SERVICE_URL to gateway's env.js / .env, e.g. http://localhost:3003
  changeOrigin: true,
  proxyTimeout: env.proxyTimeoutMs,
  timeout: env.proxyTimeoutMs,
  pathRewrite: (path) => `/internal/v1/search${path}`,

  on: {
    proxyReq(proxyReq, req, res) {
      if (env.internalServiceToken) {
        proxyReq.setHeader("X-Internal-Service-Token", env.internalServiceToken);
      }
      if (req.id) {
        proxyReq.setHeader("X-Request-Id", req.id);
      }
      proxyReq.setHeader("X-Forwarded-For", req.headers["x-forwarded-for"] || req.ip);
      // Authorization header (if any) forwards automatically — search
      // is public, so this proxy does NOT require it like auth's does.
    },

    error(err, req, res) {
      logger.error("Search service proxy error", { error: err.message, requestId: req.id });
      if (!res.headersSent) {
        res.status(502).json({
          error: { code: "BAD_GATEWAY", message: "Search service is currently unavailable" },
          requestId: req.id,
        });
      }
    },
  },
});

module.exports = searchProxy;