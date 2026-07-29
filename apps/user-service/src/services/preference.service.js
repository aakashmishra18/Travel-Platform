const PreferenceRepository = require("../repositories/preference.repository");
const SettingsRepository = require("../repositories/settings.repository");

function toPublicPreferences(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    language: row.language,
    currency: row.currency,
    timezone: row.timezone,
    flight: { seat: row.flight_seat, meal: row.flight_meal, class: row.flight_class },
    hotel: { roomPreference: row.hotel_room_pref, accessibility: row.hotel_accessibility },
    rail: { berth: row.rail_berth, class: row.rail_class },
    updatedAt: row.updated_at,
  };
}

function toPublicSettings(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    accessibility: row.accessibility,
    display: row.display,
    regional: row.regional,
    updatedAt: row.updated_at,
  };
}

const PreferenceService = {
  async getPreferences(userId) {
    const row = await PreferenceRepository.findByUserId(userId);
    return toPublicPreferences(row) || { userId, language: "en", currency: "INR", timezone: "Asia/Kolkata" };
  },

  async updatePreferences(userId, fields) {
    const row = await PreferenceRepository.upsert(null, userId, fields);
    return toPublicPreferences(row);
  },

  async getSettings(userId) {
    const row = await SettingsRepository.findByUserId(userId);
    return toPublicSettings(row) || { userId, accessibility: {}, display: {}, regional: {} };
  },

  async updateSettings(userId, fields) {
    const row = await SettingsRepository.upsert(null, userId, fields);
    return toPublicSettings(row);
  },
};

module.exports = PreferenceService;
