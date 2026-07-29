const { pool } = require("../config/db");

const ProfileRepository = {
  async findByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Creates the profile row if it doesn't exist yet, or updates the
   * given fields if it does. Profiles aren't created at registration
   * time (that's auth-service's job) — the first PUT from the client
   * effectively creates it here.
   */
  async upsert(client, userId, fields) {
    const executor = client || pool;
    const {
      firstName = null,
      lastName = null,
      dateOfBirth = null,
      gender = null,
      phone = null,
      profileImageUrl = null,
    } = fields;

    const { rows } = await executor.query(
      `INSERT INTO user_profiles (user_id, first_name, last_name, date_of_birth, gender, phone, profile_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
         last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
         date_of_birth = COALESCE(EXCLUDED.date_of_birth, user_profiles.date_of_birth),
         gender = COALESCE(EXCLUDED.gender, user_profiles.gender),
         phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
         profile_image_url = COALESCE(EXCLUDED.profile_image_url, user_profiles.profile_image_url),
         updated_at = now()
       RETURNING *`,
      [userId, firstName, lastName, dateOfBirth, gender, phone, profileImageUrl]
    );
    return rows[0];
  },

  async setStatus(client, userId, status) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE user_profiles SET profile_status = $2, updated_at = now()
       WHERE user_id = $1 RETURNING *`,
      [userId, status]
    );
    return rows[0] || null;
  },

  /**
   * Scrubs PII in place for GDPR-style anonymization while keeping the
   * row (and its user_id) for referential/audit purposes.
   */
  async anonymize(client, userId) {
    const executor = client || pool;
    await executor.query(
      `UPDATE user_profiles SET
         first_name = NULL, last_name = NULL, date_of_birth = NULL,
         gender = NULL, phone = NULL, profile_image_url = NULL,
         profile_status = 'ANONYMIZED', updated_at = now()
       WHERE user_id = $1`,
      [userId]
    );
  },
};

module.exports = ProfileRepository;
