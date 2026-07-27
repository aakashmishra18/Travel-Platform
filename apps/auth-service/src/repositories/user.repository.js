const { pool } = require('../config/db');

/**
 * Data-access layer for auth_users.
 * No business rules live here - only SQL.
 */
const UserRepository = {
  async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM auth_users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM auth_users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(client, { email, passwordHash }) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `INSERT INTO auth_users (email, password_hash)
       VALUES ($1, $2)
       RETURNING *`,
      [email, passwordHash]
    );
    return rows[0];
  },

  async markEmailVerified(client, userId) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE auth_users
         SET email_verified = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId]
    );
    return rows[0];
  },

  async updatePasswordHash(client, userId, passwordHash) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE auth_users
         SET password_hash = $2,
             password_changed_at = NOW(),
             updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, passwordHash]
    );
    return rows[0];
  },

  async incrementFailedAttempts(client, userId) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE auth_users
         SET failed_login_attempts = failed_login_attempts + 1,
             updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId]
    );
    return rows[0];
  },

  async resetFailedAttempts(client, userId) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE auth_users
         SET failed_login_attempts = 0,
             locked_until = NULL,
             updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId]
    );
    return rows[0];
  },

  async lockUntil(client, userId, lockedUntilDate) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE auth_users
         SET locked_until = $2,
             updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, lockedUntilDate]
    );
    return rows[0];
  },

  async updateStatus(client, userId, status) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE auth_users
         SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, status]
    );
    return rows[0];
  },
};

module.exports = UserRepository;