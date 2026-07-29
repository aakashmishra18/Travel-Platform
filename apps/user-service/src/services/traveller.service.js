const { withTransaction } = require("../config/db");
const TravellerRepository = require("../repositories/traveller.repository");
const ApiError = require("../utils/ApiError");

function toPublicTraveller(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    relationship: row.relationship,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    nationality: row.nationality,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Loads a traveller and throws unless it belongs to userId. Centralizing
 * this ownership check here means every controller method gets it for
 * free instead of re-implementing the same check repeatedly.
 */
async function loadOwned(travellerId, userId) {
  const traveller = await TravellerRepository.findById(travellerId);
  if (!traveller || traveller.user_id !== userId) {
    throw ApiError.notFound("Traveller not found");
  }
  return traveller;
}

const TravellerService = {
  async list(userId) {
    const rows = await TravellerRepository.listByUser(userId);
    return rows.map(toPublicTraveller);
  },

  async get(userId, travellerId) {
    const row = await loadOwned(travellerId, userId);
    return toPublicTraveller(row);
  },

  async create(userId, data) {
    if (data.relationship === "SELF") {
      const existing = await TravellerRepository.listByUser(userId);
      if (existing.some((t) => t.relationship === "SELF")) {
        throw ApiError.conflict("A SELF traveller already exists for this account");
      }
    }
    const row = await TravellerRepository.create(null, userId, data);
    return toPublicTraveller(row);
  },

  async update(userId, travellerId, data) {
    await loadOwned(travellerId, userId);
    const row = await TravellerRepository.update(null, travellerId, data);
    return toPublicTraveller(row);
  },

  async remove(userId, travellerId) {
    const traveller = await loadOwned(travellerId, userId);
    if (traveller.relationship === "SELF") {
      throw ApiError.badRequest("Cannot delete the SELF traveller profile");
    }
    return withTransaction((client) => TravellerRepository.delete(client, travellerId));
  },

  // Exposed so document.service can reuse the same ownership check.
  loadOwned,
};

module.exports = TravellerService;
