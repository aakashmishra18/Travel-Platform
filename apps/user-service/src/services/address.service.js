const { withTransaction } = require("../config/db");
const AddressRepository = require("../repositories/address.repository");
const ApiError = require("../utils/ApiError");

function toPublic(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    companyName: row.company_name,
    gstNumber: row.gst_number,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadOwned(addressId, userId) {
  const row = await AddressRepository.findById(addressId);
  if (!row || row.user_id !== userId) throw ApiError.notFound("Address not found");
  return row;
}

const AddressService = {
  async list(userId) {
    const rows = await AddressRepository.listByUser(userId);
    return rows.map(toPublic);
  },
  async create(userId, data) {
    const row = await AddressRepository.create(null, userId, data);
    return toPublic(row);
  },
  async update(userId, addressId, data) {
    await loadOwned(addressId, userId);
    const row = await AddressRepository.update(null, addressId, data);
    return toPublic(row);
  },
  async remove(userId, addressId) {
    await loadOwned(addressId, userId);
    return withTransaction((client) => AddressRepository.delete(client, addressId));
  },
};

module.exports = AddressService;
