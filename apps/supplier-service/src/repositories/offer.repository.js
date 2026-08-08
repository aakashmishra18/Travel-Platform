const { pool } = require("../config/db");

const OfferRepository = {
  async create(client, offer) {
    const executor = client || pool;
    const {
      provider, providerOfferId, origin, destination, departureDate, returnDate,
      cabinClass, priceAmount, priceCurrency, payload, expiresAt,
    } = offer;

    const { rows } = await executor.query(
      `INSERT INTO supplier_offers
         (provider, provider_offer_id, origin, destination, departure_date, return_date,
          cabin_class, price_amount, price_currency, payload, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [provider, providerOfferId || null, origin, destination, departureDate, returnDate || null,
       cabinClass, priceAmount, priceCurrency, JSON.stringify(payload), expiresAt]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM supplier_offers WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async updateStatus(client, id, status) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE supplier_offers SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return rows[0] || null;
  },

  async updatePrice(client, id, priceAmount) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE supplier_offers SET price_amount = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, priceAmount]
    );
    return rows[0] || null;
  },

  /**
   * The offer's own id doesn't exist until AFTER the initial insert
   * (Postgres generates it), so the stored payload starts out missing
   * its own offerId. This patches it in as a fast follow-up write —
   * called once per newly-created offer during search.
   */
  async setPayload(client, id, payload) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `UPDATE supplier_offers SET payload = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, JSON.stringify(payload)]
    );
    return rows[0] || null;
  },

  /**
   * Sweeps offers past their expiry into EXPIRED status. Called
   * lazily (see offer.service.js) rather than via a cron — simpler to
   * operate for now; a real deployment might run this on a schedule
   * instead so status is always current even for offers no one ever
   * looks up again.
   */
  async expireStaleOffers() {
    await pool.query(
      `UPDATE supplier_offers SET status = 'EXPIRED', updated_at = NOW()
       WHERE status = 'ACTIVE' AND expires_at < NOW()`
    );
  },
};

module.exports = OfferRepository;
