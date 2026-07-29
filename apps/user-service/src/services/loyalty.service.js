const { withTransaction } = require("../config/db");
const LoyaltyRepository = require("../repositories/loyalty.repository");
const ApiError = require("../utils/ApiError");

function toPublic(row) {
  return {
    id: row.id,
    userId: row.user_id,
    programType: row.program_type,
    providerName: row.provider_name,
    membershipNumber: row.membership_number,
    createdAt: row.created_at,
  };
}

const LoyaltyService = {
  async list(userId) {
    const rows = await LoyaltyRepository.listByUser(userId);
    return rows.map(toPublic);
  },
  async create(userId, data) {
    const row = await LoyaltyRepository.create(null, userId, data);
    return toPublic(row);
  },
  async remove(userId, loyaltyId) {
    const row = await LoyaltyRepository.findById(loyaltyId);
    if (!row || row.user_id !== userId) throw ApiError.notFound("Loyalty program not found");
    return withTransaction((client) => LoyaltyRepository.delete(client, loyaltyId));
  },
};

module.exports = LoyaltyService;
