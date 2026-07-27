const SessionRepository = require('../repositories/session.repository');
const env = require('../config/env');

function refreshExpiryDate() {
  const match = /^(\d+)([smhd])$/.exec(env.jwt.refreshExpiresIn);
  const value = parseInt(match[1], 10);
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return new Date(Date.now() + value * unitMs);
}

const SessionService = {
  async createSession(client, { userId, userAgent, ipAddress, deviceName }) {
    return SessionRepository.create(client, {
      userId,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      deviceName: deviceName || null,
      expiresAt: refreshExpiryDate(),
    });
  },

  async listActiveSessions(userId) {
    return SessionRepository.listActiveForUser(userId);
  },

  async revokeSession(client, sessionId, userId) {
    return SessionRepository.revoke(client, sessionId, userId);
  },

  async revokeAllSessions(client, userId) {
    return SessionRepository.revokeAllForUser(client, userId);
  },
};

module.exports = SessionService;