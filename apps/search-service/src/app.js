const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const env = require("./config/env");
const logger = require("./utils/logger");
const { checkConnection } = require("./config/db");
const requestId = require("./middleware/requestId.middleware");
const rateLimiter = require("./middleware/rateLimit.middleware");
const verifyInternalCaller = require("./middleware/verifyInternalCaller.middleware");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");
const searchRoutes = require("./routes/search.routes");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // trust exactly one hop (the API Gateway)
app.use(helmet());
app.use(
  cors({
    origin: env.corsAllowedOrigins.length ? env.corsAllowedOrigins : false,
    credentials: true,
  })
);
app.use(requestId);
app.use(morgan("dev", { stream: { write: (msg) => logger.info(msg.trim()) } }));
// Small body limit — search requests are a handful of fields, never a
// legitimate reason for a large payload here. Caps a class of abuse
// (oversized bodies tying up memory/bandwidth) cheaply.
app.use(express.json({ limit: "10kb" }));

// Liveness: process is up. Used by simple checks that just want "is it
// running at all" without touching the database.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: env.serviceName });
});

// Readiness: process is up AND its dependencies (the database) are
// actually reachable. This is the one container orchestrators /
// compose healthchecks should point at — a service that's "running"
// but can't reach Postgres should NOT be marked healthy.
app.get("/health/ready", async (req, res) => {
  try {
    await checkConnection();
    res.status(200).json({ status: "ready", service: env.serviceName });
  } catch (err) {
    logger.error("Readiness check failed — database unreachable", { error: err.message });
    res.status(503).json({ status: "not_ready", service: env.serviceName, error: "database unreachable" });
  }
});

app.use("/internal/v1/search", verifyInternalCaller, rateLimiter, searchRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
