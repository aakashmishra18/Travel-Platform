const { withTransaction } = require("../config/db");
const ContactRepository = require("../repositories/contact.repository");
const ApiError = require("../utils/ApiError");

function toPublic(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    value: row.value,
    label: row.label,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

const ContactService = {
  async list(userId) {
    const rows = await ContactRepository.listByUser(userId);
    return rows.map(toPublic);
  },
  async create(userId, data) {
    const row = await ContactRepository.create(null, userId, data);
    return toPublic(row);
  },
  async remove(userId, contactId) {
    const row = await ContactRepository.findById(contactId);
    if (!row || row.user_id !== userId) throw ApiError.notFound("Contact not found");
    return withTransaction((client) => ContactRepository.delete(client, contactId));
  },
};

module.exports = ContactService;
