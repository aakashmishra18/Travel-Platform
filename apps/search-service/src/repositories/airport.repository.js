const { pool } = require("../config/db");

const AirportRepository = {
  async findByCode(code) {
    const { rows } = await pool.query(`SELECT * FROM airports WHERE code = $1`, [code.toUpperCase()]);
    return rows[0] || null;
  },

  async findByCodes(codes) {
    const { rows } = await pool.query(
      `SELECT * FROM airports WHERE code = ANY($1::char(3)[])`,
      [codes.map((c) => c.toUpperCase())]
    );
    return rows;
  },

  /**
   * Autocomplete search — matches airport code, name, or city,
   * case-insensitive, prefix-first ordering so exact/near matches
   * surface before loose substring matches.
   */
  async search(query, limit = 10) {
    const q = query.trim();
    const { rows } = await pool.query(
      `SELECT * FROM airports
        WHERE code ILIKE $1 OR name ILIKE $2 OR city ILIKE $2
        ORDER BY
          CASE WHEN code ILIKE $1 THEN 0 ELSE 1 END,
          CASE WHEN city ILIKE $1 THEN 0 ELSE 1 END,
          city ASC
        LIMIT $3`,
      [`${q}%`, `%${q}%`, limit]
    );
    return rows;
  },
};

module.exports = AirportRepository;
