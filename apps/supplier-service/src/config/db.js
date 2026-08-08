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

async function checkConnection() {
  await pool.query("SELECT 1");
}

module.exports = { pool, withTransaction, checkConnection };
