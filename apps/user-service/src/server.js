const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");

app.listen(env.port, () => {
  logger.info(`${env.serviceName} listening on port ${env.port} [${env.nodeEnv}]`);
});
