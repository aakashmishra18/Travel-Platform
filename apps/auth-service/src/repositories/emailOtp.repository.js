const { pool } = require("../config/db");

const EmailOtpRepository = {
  async create(client, { userId, otpHash, expiresAt }) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `INSERT INTO email_otps (user_id, otp_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, otpHash, expiresAt]
    );
    return rows[0];
  },

  /**
   * The most recent unused, unexpired OTP for this user — there should
   * only ever be one "live" OTP at a time since invalidateAllForUser
   * runs before every new one is issued.
   */
  async findValidByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM email_otps
        WHERE user_id = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  async incrementAttempts(client, id) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts`,
      [id]
    );
    return rows[0]?.attempts ?? null;
  },

  async markUsed(client, id) {
    const executor = client || pool;
    await executor.query(`UPDATE email_otps SET used_at = NOW() WHERE id = $1`, [id]);
  },

  async invalidateAllForUser(client, userId) {
    const executor = client || pool;
    await executor.query(
      `UPDATE email_otps SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
  },
};

module.exports = EmailOtpRepository;
