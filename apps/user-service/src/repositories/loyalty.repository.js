const { pool } = require("../config/db");

const LoyaltyRepository = {
  async listByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM loyalty_programs WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows;
  },

  async findById(loyaltyId) {
    const { rows } = await pool.query(`SELECT * FROM loyalty_programs WHERE id = $1`, [loyaltyId]);
    return rows[0] || null;
  },

  async create(client, userId, data) {
    const executor = client || pool;
    const { programType, providerName, membershipNumber } = data;
    const { rows } = await executor.query(
      `INSERT INTO loyalty_programs (user_id, program_type, provider_name, membership_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, programType, providerName, membershipNumber]
    );
    return rows[0];
  },

  async delete(client, loyaltyId) {
    const executor = client || pool;
    const { rowCount } = await executor.query(`DELETE FROM loyalty_programs WHERE id = $1`, [loyaltyId]);
    return rowCount > 0;
  },
};

module.exports = LoyaltyRepository;
