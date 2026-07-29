const { pool } = require("../config/db");

const PreferenceRepository = {
  async findByUserId(userId) {
    const { rows } = await pool.query(`SELECT * FROM user_preferences WHERE user_id = $1`, [userId]);
    return rows[0] || null;
  },

  async upsert(client, userId, fields) {
    const executor = client || pool;
    const {
      language, currency, timezone,
      flightSeat, flightMeal, flightClass,
      hotelRoomPref, hotelAccessibility,
      railBerth, railClass,
    } = fields;

    const { rows } = await executor.query(
      `INSERT INTO user_preferences
         (user_id, language, currency, timezone, flight_seat, flight_meal, flight_class,
          hotel_room_pref, hotel_accessibility, rail_berth, rail_class)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id) DO UPDATE SET
         language = COALESCE(EXCLUDED.language, user_preferences.language),
         currency = COALESCE(EXCLUDED.currency, user_preferences.currency),
         timezone = COALESCE(EXCLUDED.timezone, user_preferences.timezone),
         flight_seat = COALESCE(EXCLUDED.flight_seat, user_preferences.flight_seat),
         flight_meal = COALESCE(EXCLUDED.flight_meal, user_preferences.flight_meal),
         flight_class = COALESCE(EXCLUDED.flight_class, user_preferences.flight_class),
         hotel_room_pref = COALESCE(EXCLUDED.hotel_room_pref, user_preferences.hotel_room_pref),
         hotel_accessibility = COALESCE(EXCLUDED.hotel_accessibility, user_preferences.hotel_accessibility),
         rail_berth = COALESCE(EXCLUDED.rail_berth, user_preferences.rail_berth),
         rail_class = COALESCE(EXCLUDED.rail_class, user_preferences.rail_class),
         updated_at = now()
       RETURNING *`,
      [userId, language || null, currency || null, timezone || null, flightSeat || null,
       flightMeal || null, flightClass || null, hotelRoomPref || null, hotelAccessibility || null,
       railBerth || null, railClass || null]
    );
    return rows[0];
  },
};

module.exports = PreferenceRepository;
