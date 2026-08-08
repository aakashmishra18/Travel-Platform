/**
 * Minimal migration runner.
 * Applies schema.sql idempotently (all statements use IF NOT EXISTS).
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    logger.info('Applying supplier-service schema...');
    await client.query(sql);
    logger.info('Schema applied successfully.');
  } catch (err) {
    logger.error('Migration failed', { error: err.message });
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
