const ConsentRepository = require("../repositories/consent.repository");

function toPublic(row) {
  return {
    id: row.id,
    userId: row.user_id,
    consentType: row.consent_type,
    status: row.status,
    version: row.version,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
  };
}

const ConsentService = {
  async list(userId) {
    const rows = await ConsentRepository.listByUser(userId);
    return rows.map(toPublic);
  },

  async record(userId, { consentType, status, version }) {
    const row = await ConsentRepository.record(null, userId, { consentType, status, version });
    return toPublic(row);
  },
};

module.exports = ConsentService;
