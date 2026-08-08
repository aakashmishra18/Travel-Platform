const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');
const logger = require('./utils/logger');

const server = app.listen(env.port, () => {
  logger.info(`${env.serviceName} listening on port ${env.port} [${env.nodeEnv}]`);
});

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
      logger.info('PostgreSQL pool closed. Exiting.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason?.message || reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
