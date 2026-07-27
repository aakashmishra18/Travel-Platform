const { pool } = require('../config/db');

const RefreshTokenRepository = {
  async create(client, { userId, tokenHash, expiresAt }) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return rows[0];
  },

  async findByHash(tokenHash) {
    const { rows } = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  /**
   * Rotation: revoke the old token and point it at its replacement in the
   * same statement so a stolen, replayed refresh token is unambiguously
   * detectable (its `revoked_at` will already be set).
   */
  async revokeAndReplace(client, oldTokenId, newTokenId) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE refresh_tokens
         SET revoked_at = NOW(),
             replaced_by_token_id = $2
       WHERE id = $1
       RETURNING *`,
      [oldTokenId, newTokenId]
    );
    return rows[0];
  },

  async revoke(client, tokenId) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE refresh_tokens
         SET revoked_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [tokenId]
    );
    return rows[0];
  },

  async revokeAllForUser(client, userId) {
    const executor = client || pool;
    await executor.query(
      `UPDATE refresh_tokens
         SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  },
};

module.exports = RefreshTokenRepository;