const logger = require('../utils/logger');
const env = require('../config/env');
const transporter = require('../utils/mailer');

/**
 * Temporary direct-send adapter. In production this should publish a
 * `notification.requested.v1` event via the outbox (consumed by the
 * Notification Service) instead of sending mail directly from
 * auth-service. Sending directly via Gmail SMTP for now so auth flows
 * are fully runnable before Kafka/outbox exists.
 */
const EmailService = {
  async sendVerificationEmail(toEmail, plainToken) {
    logger.info('Dispatching verification email', { from: env.email.from, to: toEmail });
    await transporter.sendMail({
      from: env.email.from,
      to: toEmail,
      subject: 'Verify your email',
      text: `Your verification token: ${plainToken}`,
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
    logger.info('Dispatching password reset email', { from: env.email.from, to: toEmail });
    await transporter.sendMail({
      from: env.email.from,
      to: toEmail,
      subject: 'Reset your password',
      text: `Your reset token: ${plainToken}`,
    });
    return { queued: true };
  },

  /**
   * Sends the numeric OTP used to verify an email address right after
   * registration.
   */
  async sendOtpEmail(toEmail, otp) {
    logger.info('Dispatching registration OTP email', { from: env.email.from, to: toEmail });
    await transporter.sendMail({
      from: env.email.from,
      to: toEmail,
      subject: 'Your OTP code',
      text: `Your OTP is: ${otp}`,
    });
    return { queued: true };
  },
};

module.exports = EmailService;