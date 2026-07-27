const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../config/env');

const PasswordService = {
  async hash(plainPassword) {
    return bcrypt.hash(plainPassword, env.bcryptSaltRounds);
  },

  async verify(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  },

  /**
   * One-way hash for opaque tokens (email verification / password reset /
   * refresh tokens) before they touch the database. The plaintext token is
   * only ever sent to the user (email/response body); only the hash is
   * stored, so a DB leak alone can't be used to impersonate a user.
   */
  hashToken(plainToken) {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
  },

  generateOpaqueToken() {
    return crypto.randomBytes(32).toString('hex');
  },
};

module.exports = PasswordService;