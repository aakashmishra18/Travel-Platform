const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const env = require("./config/env");
const logger = require("./utils/logger");
const requestId = require("./middleware/requestId.middleware");
const rateLimiter = require("./middleware/rateLimit.middleware");
const verifyInternalCaller = require("./middleware/verifyInternalCaller.middleware");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");
const userRoutes = require("./routes/user.routes");

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
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: env.serviceName });
});

// Every /internal/v1/users/* route requires both: (a) it came through the
// gateway (verifyInternalCaller), and (b) a valid user JWT (requireAuth,
// applied inside user.routes.js itself for every individual route).
app.use("/internal/v1/users", verifyInternalCaller, rateLimiter, userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
