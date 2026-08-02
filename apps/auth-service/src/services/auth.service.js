const { withTransaction, pool } = require('../config/db');
const UserRepository = require('../repositories/user.repository');
const LoginAttemptRepository = require('../repositories/loginAttempt.repository');
const EmailVerificationTokenRepository = require('../repositories/emailVerificationToken.repository');
const EmailOtpRepository = require('../repositories/emailOtp.repository');
const PasswordResetTokenRepository = require('../repositories/passwordResetToken.repository');
const RefreshTokenRepository = require('../repositories/refreshToken.repository');
const OutboxEventRepository = require('../repositories/outboxEvent.repository');

const PasswordService = require('./password.service');
const TokenService = require('./token.service');
const SessionService = require('./session.service');
const EmailService = require('./email.service');
const { generateOtp, hashOtp } = require('../utils/otp');

const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { USER_STATUS, LOGIN_FAILURE_REASON } = require('../utils/constants');

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

// Registration OTPs are short-lived and single-use; 10 minutes gives a
// real person enough time to switch to their inbox without leaving the
// window open long enough to be a meaningful brute-force target.
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified,
    status: user.status,
    createdAt: user.created_at,
  };
}

const AuthService = {
  // ---------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------
  async register({ email, password }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await PasswordService.hash(password);

    const user = await withTransaction(async (client) => {
      const created = await UserRepository.create(client, { email, passwordHash });

      // Existing link-based verification token — left in place so any
      // client already using /verify-email keeps working.
      const plainToken = PasswordService.generateOpaqueToken();
      const tokenHash = PasswordService.hashToken(plainToken);
      await EmailVerificationTokenRepository.create(client, {
        userId: created.id,
        tokenHash,
        expiresAt: addMinutes(new Date(), env.tokenTtl.emailVerificationMinutes),
      });

      await OutboxEventRepository.create(client, {
        aggregateType: 'auth_user',
        aggregateId: created.id,
        eventType: 'auth.user_registered.v1',
        payload: { userId: created.id, email: created.email },
      });

      // Fire-and-forget within the same request; a real implementation
      // would rely solely on the outbox row above once Kafka exists.
      await EmailService.sendVerificationEmail(created.email, plainToken);

      // New: numeric OTP, sent alongside the link, so clients can offer
      // either "click the link" or "enter the code" verification.
      const otp = generateOtp(6);
      const otpHash = hashOtp(otp);
      await EmailOtpRepository.create(client, {
        userId: created.id,
        otpHash,
        expiresAt: addMinutes(new Date(), OTP_TTL_MINUTES),
      });
      await EmailService.sendOtpEmail(created.email, otp);

      return created;
    });

    return toPublicUser(user);
  },

  // ---------------------------------------------------------------------
  // Email verification via OTP (sent automatically at registration)
  // ---------------------------------------------------------------------
  async verifyRegistrationOtp({ email, otp }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Don't reveal whether the account exists.
      throw ApiError.badRequest('Invalid or expired OTP');
    }
    if (user.email_verified) {
      throw ApiError.conflict('Email is already verified');
    }

    const record = await EmailOtpRepository.findValidByUserId(user.id);
    if (!record) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw ApiError.badRequest('Too many incorrect attempts. Request a new OTP.');
    }

    const providedHash = hashOtp(otp);
    if (providedHash !== record.otp_hash) {
      await EmailOtpRepository.incrementAttempts(null, record.id);
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    await withTransaction(async (client) => {
      await EmailOtpRepository.markUsed(client, record.id);
      await UserRepository.markEmailVerified(client, user.id);
    });
  },

  async resendRegistrationOtp({ email }) {
    const user = await UserRepository.findByEmail(email);
    // Always respond success-shaped regardless of whether the account
    // exists, to avoid leaking account existence via this endpoint.
    if (!user || user.email_verified) return;

    await withTransaction(async (client) => {
      await EmailOtpRepository.invalidateAllForUser(client, user.id);
      const otp = generateOtp(6);
      const otpHash = hashOtp(otp);
      await EmailOtpRepository.create(client, {
        userId: user.id,
        otpHash,
        expiresAt: addMinutes(new Date(), OTP_TTL_MINUTES),
      });
      await EmailService.sendOtpEmail(user.email, otp);
    });
  },

  // ---------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------
  async login({ email, password, ipAddress, userAgent, deviceName }) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      await LoginAttemptRepository.record(null, {
        email,
        ipAddress,
        userAgent,
        successful: false,
        failureReason: LOGIN_FAILURE_REASON.INVALID_CREDENTIALS,
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await LoginAttemptRepository.record(null, {
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        successful: false,
        failureReason: LOGIN_FAILURE_REASON.ACCOUNT_LOCKED,
      });
      throw ApiError.locked('Account is temporarily locked due to failed login attempts');
    }

    if (user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.DISABLED) {
      await LoginAttemptRepository.record(null, {
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        successful: false,
        failureReason:
          user.status === USER_STATUS.SUSPENDED
            ? LOGIN_FAILURE_REASON.ACCOUNT_SUSPENDED
            : LOGIN_FAILURE_REASON.ACCOUNT_DISABLED,
      });
      throw ApiError.forbidden(`Account is ${user.status.toLowerCase()}`);
    }

    const passwordMatches = await PasswordService.verify(password, user.password_hash);

    if (!passwordMatches) {
      await withTransaction(async (client) => {
        const updated = await UserRepository.incrementFailedAttempts(client, user.id);
        await LoginAttemptRepository.record(client, {
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          successful: false,
          failureReason: LOGIN_FAILURE_REASON.INVALID_CREDENTIALS,
        });

        if (updated.failed_login_attempts >= env.lockout.maxFailedAttempts) {
          await UserRepository.lockUntil(
            client,
            user.id,
            addMinutes(new Date(), env.lockout.durationMinutes)
          );
        }
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Successful login: reset lockout counters, create session + tokens,
    // and record the audit trail, all in one transaction.
    const result = await withTransaction(async (client) => {
      await UserRepository.resetFailedAttempts(client, user.id);

      const session = await SessionService.createSession(client, {
        userId: user.id,
        userAgent,
        ipAddress,
        deviceName,
      });

      const accessToken = TokenService.signAccessToken(user, session.id);
      const { plainToken: refreshToken } = await TokenService.issueRefreshToken(client, user.id);

      await LoginAttemptRepository.record(client, {
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        successful: true,
      });

      return { accessToken, refreshToken, session };
    });

    return {
      user: toPublicUser(user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.session.id,
      expiresIn: env.jwt.accessExpiresIn,
    };
  },

  // ---------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------
  async refresh({ refreshToken }) {
    const result = await withTransaction(async (client) => {
      const rotated = await TokenService.rotateRefreshToken(client, refreshToken);
      const user = await UserRepository.findById(rotated.userId);
      if (!user || user.status !== USER_STATUS.ACTIVE) {
        throw ApiError.unauthorized('Account is not active');
      }
      const accessToken = TokenService.signAccessToken(user, null);
      return { accessToken, refreshToken: rotated.plainToken };
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: env.jwt.accessExpiresIn,
    };
  },

  // ---------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------
  async logout({ refreshToken, sessionId, userId }) {
    await withTransaction(async (client) => {
      if (refreshToken) {
        const tokenHash = PasswordService.hashToken(refreshToken);
        const existing = await RefreshTokenRepository.findByHash(tokenHash);
        if (existing) {
          await RefreshTokenRepository.revoke(client, existing.id);
        }
      }
      if (sessionId && userId) {
        await SessionService.revokeSession(client, sessionId, userId);
      }
    });
  },

  async logoutAll({ userId }) {
    await withTransaction(async (client) => {
      await RefreshTokenRepository.revokeAllForUser(client, userId);
      await SessionService.revokeAllSessions(client, userId);
    });
  },

  // ---------------------------------------------------------------------
  // Current user / account status
  // ---------------------------------------------------------------------
  async getCurrentUser(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (user.status !== USER_STATUS.ACTIVE) {
      throw ApiError.forbidden(`Account is ${user.status.toLowerCase()}`);
    }
    return toPublicUser(user);
  },

  // ---------------------------------------------------------------------
  // Email verification (existing link-based flow — unchanged)
  // ---------------------------------------------------------------------
  async verifyEmail({ token }) {
    const tokenHash = PasswordService.hashToken(token);
    const record = await EmailVerificationTokenRepository.findValidByHash(tokenHash);
    if (!record) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    await withTransaction(async (client) => {
      await EmailVerificationTokenRepository.markUsed(client, record.id);
      await UserRepository.markEmailVerified(client, record.user_id);
    });
  },

  async resendVerification({ email }) {
    const user = await UserRepository.findByEmail(email);
    // Always respond success-shaped regardless of whether the account
    // exists, to avoid leaking account existence via this endpoint.
    if (!user || user.email_verified) return;

    await withTransaction(async (client) => {
      await EmailVerificationTokenRepository.invalidateAllForUser(client, user.id);
      const plainToken = PasswordService.generateOpaqueToken();
      const tokenHash = PasswordService.hashToken(plainToken);
      await EmailVerificationTokenRepository.create(client, {
        userId: user.id,
        tokenHash,
        expiresAt: addMinutes(new Date(), env.tokenTtl.emailVerificationMinutes),
      });
      await EmailService.sendVerificationEmail(user.email, plainToken);
    });
  },

  // ---------------------------------------------------------------------
  // Forgot / reset password
  // ---------------------------------------------------------------------
  async forgotPassword({ email }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) return; // do not leak account existence

    await withTransaction(async (client) => {
      await PasswordResetTokenRepository.invalidateAllForUser(client, user.id);
      const plainToken = PasswordService.generateOpaqueToken();
      const tokenHash = PasswordService.hashToken(plainToken);
      await PasswordResetTokenRepository.create(client, {
        userId: user.id,
        tokenHash,
        expiresAt: addMinutes(new Date(), env.tokenTtl.passwordResetMinutes),
      });
      await EmailService.sendPasswordResetEmail(user.email, plainToken);
    });
  },

  async resetPassword({ token, newPassword }) {
    const tokenHash = PasswordService.hashToken(token);
    const record = await PasswordResetTokenRepository.findValidByHash(tokenHash);
    if (!record) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const passwordHash = await PasswordService.hash(newPassword);

    await withTransaction(async (client) => {
      await PasswordResetTokenRepository.markUsed(client, record.id);
      await UserRepository.updatePasswordHash(client, record.user_id, passwordHash);
      // Reset compromises trust in existing sessions/tokens; revoke all.
      await RefreshTokenRepository.revokeAllForUser(client, record.user_id);
      await SessionService.revokeAllSessions(client, record.user_id);
    });
  },

  // ---------------------------------------------------------------------
  // Change password (authenticated)
  // ---------------------------------------------------------------------
  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await UserRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const matches = await PasswordService.verify(currentPassword, user.password_hash);
    if (!matches) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    const passwordHash = await PasswordService.hash(newPassword);

    await withTransaction(async (client) => {
      await UserRepository.updatePasswordHash(client, userId, passwordHash);
      await RefreshTokenRepository.revokeAllForUser(client, userId);
      await SessionService.revokeAllSessions(client, userId);
    });
  },

  // ---------------------------------------------------------------------
  // Session / device management
  // ---------------------------------------------------------------------
  async listSessions(userId) {
    const sessions = await SessionService.listActiveSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.device_name,
      userAgent: s.user_agent,
      ipAddress: s.ip_address,
      lastActiveAt: s.last_active_at,
      createdAt: s.created_at,
    }));
  },

  async revokeSession({ userId, sessionId }) {
    const revoked = await SessionService.revokeSession(pool, sessionId, userId);
    if (!revoked) throw ApiError.notFound('Session not found');
  },
};

module.exports = AuthService;