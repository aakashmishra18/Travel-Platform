const { pool } = require('../config/db');

const SessionRepository = {
  async create(client, { userId, userAgent, ipAddress, deviceName, expiresAt }) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `INSERT INTO auth_sessions (user_id, user_agent, ip_address, device_name, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, userAgent, ipAddress, deviceName, expiresAt]
    );
    return rows[0];
  },

  async findById(sessionId) {
    const { rows } = await pool.query(
      `SELECT * FROM auth_sessions WHERE id = $1 LIMIT 1`,
      [sessionId]
    );
    return rows[0] || null;
  },

  async listActiveForUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM auth_sessions
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND expires_at > NOW()
        ORDER BY last_active_at DESC`,
      [userId]
    );
    return rows;
  },

  async touch(sessionId) {
    await pool.query(
      `UPDATE auth_sessions SET last_active_at = NOW() WHERE id = $1`,
      [sessionId]
    );
  },

  async revoke(client, sessionId, userId) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE auth_sessions
         SET revoked_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [sessionId, userId]
    );
    return rows[0] || null;
  },

  async revokeAllForUser(client, userId) {
    const executor = client || pool;
    await executor.query(
      `UPDATE auth_sessions
         SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  },
};

module.exports = SessionRepository;