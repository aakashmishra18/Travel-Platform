const winston = require("winston");
const env = require("../config/env");

const logger = winston.createLogger({
  level: env.nodeEnv === "production" ? "info" : "debug",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: env.serviceName },
  transports: [new winston.transports.Console({ format: winston.format.simple() })],
});

module.exports = logger;
