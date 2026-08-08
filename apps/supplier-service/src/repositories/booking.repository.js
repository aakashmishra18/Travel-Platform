const { pool } = require("../config/db");

const BookingRepository = {
  async create(client, booking) {
    const executor = client || pool;
    const { offerId, provider, pnr, ticketNumber, passengers } = booking;
    const { rows } = await executor.query(
      `INSERT INTO supplier_bookings (offer_id, provider, pnr, ticket_number, passengers)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [offerId, provider, pnr || null, ticketNumber || null, JSON.stringify(passengers)]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM supplier_bookings WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async updateStatus(client, id, status, { cancellationFee, refundAmount } = {}) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE supplier_bookings SET
         status = $2,
         cancellation_fee = COALESCE($3, cancellation_fee),
         refund_amount = COALESCE($4, refund_amount),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status, cancellationFee ?? null, refundAmount ?? null]
    );
    return rows[0] || null;
  },
};

module.exports = BookingRepository;
