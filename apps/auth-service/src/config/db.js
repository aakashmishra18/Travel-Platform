// const { Pool } = require("pg");

// const pool = new Pool({
//     host: process.env.DB_HOST,
//     port: Number(process.env.DB_PORT),
//     database: process.env.DB_NAME,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD
// });

// module.exports = pool;


const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.db.connectionString,
  max: env.db.poolMax,
  idleTimeoutMillis: env.db.idleTimeoutMillis,
});

pool.on('error', (err) => {
  // Idle client errors should never crash the process; log and let the
  // pool recycle the connection.
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/**
 * Run a callback inside a single transaction. Rolls back automatically
 * on any thrown error. Use this for any write path that touches more
 * than one table (e.g. login -> reset failed_login_attempts + insert
 * login_attempts + issue refresh_token).
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };