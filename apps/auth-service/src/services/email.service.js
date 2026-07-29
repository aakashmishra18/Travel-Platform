const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Placeholder email adapter. In production this publishes a
 * `notification.requested.v1` event via the outbox (consumed by the
 * Notification Service) instead of sending mail directly from
 * auth-service. Kept synchronous/logged here so the auth flows are
 * fully runnable before Kafka exists.
 */
const EmailService = {
  async sendVerificationEmail(toEmail, plainToken) {
    logger.info('Dispatching verification email (stub)', {
      from: env.email.from,
      to: toEmail,
      verificationToken: plainToken,
    });
    // TODO: replace with outbox event -> notification-service, e.g.
    // OutboxEventRepository.create(client, {
    //   aggregateType: 'auth_user', aggregateId: userId,
    //   eventType: 'auth.email_verification_requested.v1',
    //   payload: { email: toEmail, token: plainToken },
    // });
    return { queued: true };
  },

  async sendPasswordResetEmail(toEmail, plainToken) {
    logger.info('Dispatching password reset email (stub)', {
      from: env.email.from,
      to: toEmail,
      resetToken: plainToken, 
    });
    return { queued: true };
  },
};

module.exports = EmailService;