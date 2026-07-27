const { createProxyMiddleware } = require("http-proxy-middleware")

const env = require("../config/env")


const logger = require("../utils/logger");

const authProxy = createProxyMiddleware({
    target: env.services.auth,

    changeOrigin: true,

    proxyTimeout: env.proxyTimeoutMs,

    timeout: env.proxyTimeoutMs,

    // req.path here is already relative to where the router mounted this
    // proxy (e.g. "/login"), since Express strips the "/v1/auth" prefix.
    pathRewrite: (path) => `/internal/v1/auth${path}`,

    on: {

        proxyReq(proxyReq, req, res) {
            // Prove to auth-service that this call actually came through the
            // gateway, and propagate the request id for cross-service tracing.
            if (env.internalServiceToken) {
                proxyReq.setHeader("X-Internal-Service-Token", env.internalServiceToken);
            }
            if (req.id) {
                proxyReq.setHeader("X-Request-Id", req.id);
            }
            // Preserve the real client IP for login/rate-limit auditing downstream.
            proxyReq.setHeader(
                "X-Forwarded-For",
                req.headers["x-forwarded-for"] || req.ip
            );
        },

        error(err, req, res) {

            logger.error("Auth service proxy error", { error: err.message, requestId: req.id });

            if (!res.headersSent) {
                res.status(502).json({
                    error: {
                        code: "BAD_GATEWAY",
                        message: "Auth service is currently unavailable",
                    },
                    requestId: req.id,
                });
            }

        }
    }

})

module.exports = authProxy;