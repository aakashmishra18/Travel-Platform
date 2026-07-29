const { Pool } = require("pg");
const env = require("./env");
const logger = require("../utils/logger");

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: env.pgPoolMax,
  idleTimeoutMillis: env.pgIdleTimeoutMs,
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle Postgres client", { error: err.message });
});

/**
 * Runs `fn` inside a single transaction. `fn` receives a checked-out
 * client — pass it (not the pool) to every query issued inside the
 * transaction so they all share the same connection.
 */
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

module.exports = { pool, withTransaction };
