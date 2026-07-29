const { pool } = require("../config/db");

const AddressRepository = {
  async listByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows;
  },

  async findById(addressId) {
    const { rows } = await pool.query(`SELECT * FROM user_addresses WHERE id = $1`, [addressId]);
    return rows[0] || null;
  },

  async create(client, userId, data) {
    const executor = client || pool;
    const { type, line1, line2, city, state, postalCode, country, companyName, gstNumber, isDefault } = data;
    const { rows } = await executor.query(
      `INSERT INTO user_addresses
         (user_id, type, line1, line2, city, state, postal_code, country, company_name, gst_number, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [userId, type, line1, line2 || null, city || null, state || null, postalCode || null,
       country || null, companyName || null, gstNumber || null, Boolean(isDefault)]
    );
    return rows[0];
  },

  async update(client, addressId, data) {
    const executor = client || pool;
    const { type, line1, line2, city, state, postalCode, country, companyName, gstNumber, isDefault } = data;
    const { rows } = await executor.query(
      `UPDATE user_addresses SET
         type = COALESCE($2, type),
         line1 = COALESCE($3, line1),
         line2 = COALESCE($4, line2),
         city = COALESCE($5, city),
         state = COALESCE($6, state),
         postal_code = COALESCE($7, postal_code),
         country = COALESCE($8, country),
         company_name = COALESCE($9, company_name),
         gst_number = COALESCE($10, gst_number),
         is_default = COALESCE($11, is_default),
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [addressId, type, line1, line2, city, state, postalCode, country, companyName, gstNumber, isDefault]
    );
    return rows[0] || null;
  },

  async delete(client, addressId) {
    const executor = client || pool;
    const { rowCount } = await executor.query(`DELETE FROM user_addresses WHERE id = $1`, [addressId]);
    return rowCount > 0;
  },
};

module.exports = AddressRepository;
