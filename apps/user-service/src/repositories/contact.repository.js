const { pool } = require("../config/db");

const ContactRepository = {
  async listByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM saved_contacts WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows;
  },

  async findById(contactId) {
    const { rows } = await pool.query(`SELECT * FROM saved_contacts WHERE id = $1`, [contactId]);
    return rows[0] || null;
  },

  async create(client, userId, data) {
    const executor = client || pool;
    const { type, value, label, isDefault } = data;
    const { rows } = await executor.query(
      `INSERT INTO saved_contacts (user_id, type, value, label, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, value, label || null, Boolean(isDefault)]
    );
    return rows[0];
  },

  async delete(client, contactId) {
    const executor = client || pool;
    const { rowCount } = await executor.query(`DELETE FROM saved_contacts WHERE id = $1`, [contactId]);
    return rowCount > 0;
  },
};

module.exports = ContactRepository;
