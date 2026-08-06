const AirportRepository = require("../repositories/airport.repository");
const ApiError = require("../utils/ApiError");

function toPublic(row) {
  return {
    code: row.code,
    name: row.name,
    city: row.city,
    country: row.country,
    countryCode: row.country_code,
  };
}

const AirportService = {
  async search(query) {
    if (!query || query.trim().length < 2) {
      throw ApiError.badRequest("Search query must be at least 2 characters");
    }
    const rows = await AirportRepository.search(query);
    return rows.map(toPublic);
  },

  async validateCodes(codes) {
    const rows = await AirportRepository.findByCodes(codes);
    const found = new Set(rows.map((r) => r.code));
    const missing = codes.filter((c) => !found.has(c.toUpperCase()));
    if (missing.length > 0) {
      throw ApiError.badRequest(`Unknown airport code(s): ${missing.join(", ")}`);
    }
    return rows.map(toPublic);
  },
};

module.exports = AirportService;
