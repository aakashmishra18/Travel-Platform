const { pool } = require("../config/db");

const TravellerRepository = {
  async listByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM travellers WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows;
  },

  async findById(travellerId) {
    const { rows } = await pool.query(`SELECT * FROM travellers WHERE id = $1`, [travellerId]);
    return rows[0] || null;
  },

  async create(client, userId, data) {
    const executor = client || pool;
    const { type, relationship, firstName, lastName, dateOfBirth, gender, nationality } = data;
    const { rows } = await executor.query(
      `INSERT INTO travellers (user_id, type, relationship, first_name, last_name, date_of_birth, gender, nationality)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, type, relationship, firstName, lastName, dateOfBirth || null, gender || null, nationality || null]
    );
    return rows[0];
  },

  async update(client, travellerId, data) {
    const executor = client || pool;
    const { type, relationship, firstName, lastName, dateOfBirth, gender, nationality } = data;
    const { rows } = await executor.query(
      `UPDATE travellers SET
         type = COALESCE($2, type),
         relationship = COALESCE($3, relationship),
         first_name = COALESCE($4, first_name),
         last_name = COALESCE($5, last_name),
         date_of_birth = COALESCE($6, date_of_birth),
         gender = COALESCE($7, gender),
         nationality = COALESCE($8, nationality),
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [travellerId, type, relationship, firstName, lastName, dateOfBirth, gender, nationality]
    );
    return rows[0] || null;
  },

  async delete(client, travellerId) {
    const executor = client || pool;
    const { rowCount } = await executor.query(`DELETE FROM travellers WHERE id = $1`, [travellerId]);
    return rowCount > 0;
  },
};

module.exports = TravellerRepository;
