const { Pool } = require("pg");
const env = require("./env");
const logger = require("../utils/logger");

const pool = new Pool({
  connectionString: env.db.connectionString,
  max: env.db.poolMax,
  idleTimeoutMillis: env.db.idleTimeoutMillis,
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle Postgres client", { error: err.message });
});

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Used by the /health endpoint to verify the DB is actually reachable,
 * not just that the process is running. A liveness check that always
 * returns 200 regardless of DB state gives orchestrators (k8s, compose
 * healthchecks) false confidence — this makes it a real check.
 */
async function checkConnection() {
  await pool.query("SELECT 1");
}

module.exports = { pool, withTransaction, checkConnection };
