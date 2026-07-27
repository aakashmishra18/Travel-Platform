const { pool } = require('../config/db');

const EmailVerificationTokenRepository = {
  async create(client, { userId, tokenHash, expiresAt }) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return rows[0];
  },

  async findValidByHash(tokenHash) {
    const { rows } = await pool.query(
      `SELECT * FROM email_verification_tokens
        WHERE token_hash = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  async markUsed(client, tokenId) {
    const executor = client || pool;
    await executor.query(
      `UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1`,
      [tokenId]
    );
  },

  async invalidateAllForUser(client, userId) {
    const executor = client || pool;
    await executor.query(
      `UPDATE email_verification_tokens
         SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
  },
};

module.exports = EmailVerificationTokenRepository;