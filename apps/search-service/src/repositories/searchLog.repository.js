const { pool } = require("../config/db");

const SearchLogRepository = {
  async create(client, data) {
    const executor = client || pool;
    const {
      userId, origin, destination, departureDate, returnDate,
      adults, children, infants, cabinClass, resultCount,
    } = data;

    const { rows } = await executor.query(
      `INSERT INTO search_logs
         (user_id, origin, destination, departure_date, return_date,
          adults, children, infants, cabin_class, result_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId || null, origin, destination, departureDate, returnDate || null,
       adults, children, infants, cabinClass, resultCount]
    );
    return rows[0];
  },

  async recentByUser(userId, limit = 10) {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (origin, destination) *
         FROM search_logs
        WHERE user_id = $1
        ORDER BY origin, destination, created_at DESC
        LIMIT $2`,
      [userId, limit]
    );
    return rows;
  },

  async popularRoutes(limit = 10) {
    const { rows } = await pool.query(
      `SELECT origin, destination, COUNT(*) AS search_count
         FROM search_logs
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY origin, destination
        ORDER BY search_count DESC
        LIMIT $1`,
      [limit]
    );
    return rows;
  },
};

module.exports = SearchLogRepository;
