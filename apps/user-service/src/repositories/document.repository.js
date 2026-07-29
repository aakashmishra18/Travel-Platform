const { pool } = require("../config/db");
const env = require("../config/env");

/**
 * Document numbers are encrypted at rest using pgcrypto's symmetric
 * encryption, keyed by DOCUMENT_ENCRYPTION_KEY. The plaintext number is
 * never stored, logged, or returned in full by any endpoint — only a
 * masked last-4 form is exposed for display.
 */
const DocumentRepository = {
  async listByTraveller(travellerId) {
    const { rows } = await pool.query(
      `SELECT id, traveller_id, document_type, document_number_last4,
              issue_country, nationality, issue_date, expiry_date, created_at, updated_at
         FROM traveller_documents WHERE traveller_id = $1`,
      [travellerId]
    );
    return rows;
  },

  async findById(documentId) {
    const { rows } = await pool.query(
      `SELECT id, traveller_id, document_type, document_number_last4,
              issue_country, nationality, issue_date, expiry_date, created_at, updated_at
         FROM traveller_documents WHERE id = $1`,
      [documentId]
    );
    return rows[0] || null;
  },

  async create(client, travellerId, data) {
    const executor = client || pool;
    const { documentType, documentNumber, issueCountry, nationality, issueDate, expiryDate } = data;
    const last4 = documentNumber.slice(-4);

    const { rows } = await executor.query(
      `INSERT INTO traveller_documents
         (traveller_id, document_type, document_number_enc, document_number_last4,
          issue_country, nationality, issue_date, expiry_date)
       VALUES ($1, $2, pgp_sym_encrypt($3, $4), $5, $6, $7, $8, $9)
       RETURNING id, traveller_id, document_type, document_number_last4,
                 issue_country, nationality, issue_date, expiry_date, created_at, updated_at`,
      [travellerId, documentType, documentNumber, env.documentEncryptionKey, last4,
       issueCountry || null, nationality || null, issueDate || null, expiryDate || null]
    );
    return rows[0];
  },

  async delete(client, documentId) {
    const executor = client || pool;
    const { rowCount } = await executor.query(`DELETE FROM traveller_documents WHERE id = $1`, [documentId]);
    return rowCount > 0;
  },

  /**
   * Decrypts and returns the full document number. Restricted to
   * internal use only (e.g. a booking flow submitting it to an
   * airline API) — never expose this over a public endpoint directly.
   */
  async revealNumber(documentId) {
    const { rows } = await pool.query(
      `SELECT pgp_sym_decrypt(document_number_enc, $2) AS document_number
         FROM traveller_documents WHERE id = $1`,
      [documentId, env.documentEncryptionKey]
    );
    return rows[0]?.document_number || null;
  },
};

module.exports = DocumentRepository;
