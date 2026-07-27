const env = require("../config/env");

/**
 * Small dependency-free logger. Swap for winston/pino later if you need
 * structured log shipping - the call signature (level(msg, meta)) is
 * kept compatible with those so the switch is a one-file change.
 */
function timestamp() {
  return new Date().toISOString();
}

function write(level, message, meta) {
  const line = `[${timestamp()}] [${env.serviceName}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length) {
    console.log(line, meta);
  } else {
    console.log(line);
  }
}

const logger = {
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
  debug: (message, meta) => {
    if (env.nodeEnv !== "production") write("debug", message, meta);
  },
};

module.exports = logger;