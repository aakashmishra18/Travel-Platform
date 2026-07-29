const { withTransaction } = require("../config/db");
const DocumentRepository = require("../repositories/document.repository");
const TravellerService = require("./traveller.service");
const ApiError = require("../utils/ApiError");

function toPublicDocument(row) {
  return {
    id: row.id,
    travellerId: row.traveller_id,
    documentType: row.document_type,
    documentNumberMasked: row.document_number_last4 ? `****${row.document_number_last4}` : null,
    issueCountry: row.issue_country,
    nationality: row.nationality,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DocumentService = {
  async list(userId, travellerId) {
    await TravellerService.loadOwned(travellerId, userId); // 404s if not owned
    const rows = await DocumentRepository.listByTraveller(travellerId);
    return rows.map(toPublicDocument);
  },

  async create(userId, travellerId, data) {
    await TravellerService.loadOwned(travellerId, userId);
    return withTransaction(async (client) => {
      const row = await DocumentRepository.create(client, travellerId, data);
      return toPublicDocument(row);
    });
  },

  async remove(userId, travellerId, documentId) {
    await TravellerService.loadOwned(travellerId, userId);
    const doc = await DocumentRepository.findById(documentId);
    if (!doc || doc.traveller_id !== travellerId) throw ApiError.notFound("Document not found");
    return withTransaction((client) => DocumentRepository.delete(client, documentId));
  },
};

module.exports = DocumentService;
