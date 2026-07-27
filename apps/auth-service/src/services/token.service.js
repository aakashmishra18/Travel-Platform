const jwt = require('jsonwebtoken');
const env = require('../config/env');
const PasswordService = require('./password.service');
const RefreshTokenRepository = require('../repositories/refreshToken.repository');
const ApiError = require('../utils/ApiError');
const { TOKEN_TYPE } = require('../utils/constants');

function msFromNow(durationString) {
  // Accepts jsonwebtoken-style strings like '15m', '30d'.
  const match = /^(\d+)([smhd])$/.exec(durationString);
  if (!match) throw new Error(`Invalid duration string: ${durationString}`);
  const value = parseInt(match[1], 10);
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return new Date(Date.now() + value * unitMs);
}

const TokenService = {
  signAccessToken(user, sessionId) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        type: TOKEN_TYPE.ACCESS,
        sid: sessionId,
      },
      env.jwt.accessSecret,
      {
        expiresIn: env.jwt.accessExpiresIn,
        issuer: env.jwt.issuer,
        audience: env.jwt.audience,
      }
    );
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.jwt.accessSecret, {
        issuer: env.jwt.issuer,
        audience: env.jwt.audience,
      });
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired access token');
    }
  },

  /**
   * Issues a new opaque refresh token, persists only its hash, and
   * returns the plaintext token to hand back to the client. The
   * plaintext value is never stored or logged.
   */
  async issueRefreshToken(client, userId) {
    const plainToken = PasswordService.generateOpaqueToken();
    const tokenHash = PasswordService.hashToken(plainToken);
    const expiresAt = msFromNow(env.jwt.refreshExpiresIn);

    const record = await RefreshTokenRepository.create(client, {
      userId,
      tokenHash,
      expiresAt,
    });

    return { plainToken, record };
  },

  /**
   * Validates a presented refresh token and rotates it: the old token
   * is revoked and linked to its replacement so token reuse (a stolen,
   * already-rotated token being replayed) is detectable server-side.
   */
  async rotateRefreshToken(client, presentedPlainToken) {
    const tokenHash = PasswordService.hashToken(presentedPlainToken);
    const existing = await RefreshTokenRepository.findByHash(tokenHash);

    if (!existing) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    if (existing.revoked_at) {
      // Reuse of a rotated/revoked token strongly suggests token theft.
      // Revoke every token for this user as a precaution.
      await RefreshTokenRepository.revokeAllForUser(client, existing.user_id);
      throw ApiError.unauthorized('Refresh token has already been used');
    }
    if (new Date(existing.expires_at) < new Date()) {
      throw ApiError.unauthorized('Refresh token expired');
    }

    const { plainToken, record } = await TokenService.issueRefreshToken(client, existing.user_id);
    await RefreshTokenRepository.revokeAndReplace(client, existing.id, record.id);

    return { plainToken, record, userId: existing.user_id };
  },
};

module.exports = TokenService;