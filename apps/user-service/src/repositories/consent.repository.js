const { pool } = require("../config/db");

const ConsentRepository = {
  async listByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM user_consents WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Records a consent decision. Each (user, type, version) is a distinct
   * row — accepting v2 of the privacy policy after v1 creates a new row
   * rather than overwriting history, preserving an audit trail.
   */
  async record(client, userId, { consentType, status, version }) {
    const executor = client || pool;
    const now = new Date();
    const { rows } = await executor.query(
      `INSERT INTO user_consents (user_id, consent_type, status, version, accepted_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, consent_type, version) DO UPDATE SET
         status = EXCLUDED.status,
         accepted_at = CASE WHEN EXCLUDED.status = 'GRANTED' THEN now() ELSE user_consents.accepted_at END,
         revoked_at = CASE WHEN EXCLUDED.status = 'REVOKED' THEN now() ELSE NULL END
       RETURNING *`,
      [userId, consentType, status, version,
       status === "GRANTED" ? now : null,
       status === "REVOKED" ? now : null]
    );
    return rows[0];
  },
};

module.exports = ConsentRepository;
