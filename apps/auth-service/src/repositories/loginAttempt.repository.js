const { pool } = require('../config/db');

const LoginAttemptRepository = {
  async record(client, { userId, email, ipAddress, userAgent, successful, failureReason }) {
    const executor = client || pool;
    await executor.query(
      `INSERT INTO login_attempts
         (user_id, email, ip_address, user_agent, successful, failure_reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, email, ipAddress, userAgent, successful, failureReason || null]
    );
  },

  async countRecentFailuresForEmail(email, sinceDate) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
         FROM login_attempts
        WHERE LOWER(email) = LOWER($1)
          AND successful = FALSE
          AND attempted_at > $2`,
      [email, sinceDate]
    );
    return rows[0].count;
  },
};

module.exports = LoginAttemptRepository;