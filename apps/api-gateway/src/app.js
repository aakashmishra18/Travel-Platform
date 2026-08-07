const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const env = require("./config/env");
const logger = require("./utils/logger");
const requestId = require("./middleware/requestId.middleware");
const rateLimiter = require("./middleware/rateLimit.middleware");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const searchRoutes = require("./routes/search.routes");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(helmet());
app.use(
  cors({
    origin: env.corsAllowedOrigins.length ? env.corsAllowedOrigins : false,
    credentials: true,
  })
);
app.use(requestId);
app.use(morgan("dev", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// NOTE: no express.json() here on purpose. Parsing the body would
// consume the request stream before http-proxy-middleware re-streams
// it to auth-service, corrupting the forwarded request. Let
// auth-service parse JSON itself.

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: env.serviceName });
});

app.use("/v1/auth", rateLimiter, authRoutes);
app.use("/v1/users", rateLimiter, userRoutes);
app.use("/v1/search", rateLimiter, searchRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;