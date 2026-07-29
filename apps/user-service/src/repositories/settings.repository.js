const { pool } = require("../config/db");

const SettingsRepository = {
  async findByUserId(userId) {
    const { rows } = await pool.query(`SELECT * FROM user_settings WHERE user_id = $1`, [userId]);
    return rows[0] || null;
  },

  async upsert(client, userId, fields) {
    const executor = client || pool;
    const { accessibility, display, regional } = fields;

    const { rows } = await executor.query(
      `INSERT INTO user_settings (user_id, accessibility, display, regional)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         accessibility = COALESCE($2, user_settings.accessibility),
         display = COALESCE($3, user_settings.display),
         regional = COALESCE($4, user_settings.regional),
         updated_at = now()
       RETURNING *`,
      [userId, accessibility || null, display || null, regional || null]
    );
    return rows[0];
  },
};

module.exports = SettingsRepository;
