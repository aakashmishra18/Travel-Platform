const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const logger = require("./utils/logger");
const { checkConnection } = require("./config/db");
const requestId = require("./middleware/requestId.middleware");
const rateLimiter = require("./middleware/rateLimit.middleware");
const verifyInternalCaller = require("./middleware/verifyInternalCaller.middleware");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");
const supplierRoutes = require("./routes/supplier.routes");
const providerRegistry = require("./providers/providerRegistry");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
// No CORS middleware — this service is never called from a browser.
// Only other backend services (search-service, later booking-service)
// reach it, always server-to-server.
app.use(requestId);
app.use(morgan("dev", { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: "20kb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: env.serviceName });
});

app.get("/health/ready", async (req, res) => {
  try {
    await checkConnection();
    res.status(200).json({ status: "ready", service: env.serviceName });
  } catch (err) {
    logger.error("Readiness check failed — database unreachable", { error: err.message });
    res.status(503).json({ status: "not_ready", service: env.serviceName, error: "database unreachable" });
  }
});

// Matches the design doc's paths exactly: /internal/flights/search,
// /internal/providers/health, etc. — no /v1/ prefix, since this
// service has no end-user-facing surface to version alongside a
// public API contract.
app.use("/internal", verifyInternalCaller, rateLimiter, supplierRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

providerRegistry.logActiveProviders();

module.exports = app;
