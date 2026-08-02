const AuthService = require('../services/auth.service');

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
}

const AuthController = {
  async register(req, res) {
    const user = await AuthService.register(req.body);
    res.status(201).json({ user });
  },

  async login(req, res) {
    const { email, password, deviceName } = req.body;
    const result = await AuthService.login({
      email,
      password,
      deviceName,
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'],
    });
    res.status(200).json(result);
  },

  async refresh(req, res) {
    const result = await AuthService.refresh({ refreshToken: req.body.refreshToken });
    res.status(200).json(result);
  },

  async logout(req, res) {
    await AuthService.logout({
      refreshToken: req.body.refreshToken,
      sessionId: req.user?.sessionId,
      userId: req.user?.id,
    });
    res.status(204).send();
  },

  async logoutAll(req, res) {
    await AuthService.logoutAll({ userId: req.user.id });
    res.status(204).send();
  },

  async me(req, res) {
    const user = await AuthService.getCurrentUser(req.user.id);
    res.status(200).json({ user });
  },

  async verifyEmail(req, res) {
    await AuthService.verifyEmail({ token: req.body.token });
    res.status(200).json({ message: 'Email verified successfully' });
  },

  async resendVerification(req, res) {
    await AuthService.resendVerification({ email: req.body.email });
    // Intentionally generic to avoid leaking account existence.
    res.status(200).json({ message: 'If the account exists, a verification email was sent' });
  },

  // New: OTP-based email verification, sent automatically at registration.
  async verifyOtp(req, res) {
    await AuthService.verifyRegistrationOtp({ email: req.body.email, otp: req.body.otp });
    res.status(200).json({ message: 'Email verified successfully' });
  },

  async resendOtp(req, res) {
    await AuthService.resendRegistrationOtp({ email: req.body.email });
    res.status(200).json({ message: 'If the account exists, a new OTP was sent' });
  },

  async forgotPassword(req, res) {
    await AuthService.forgotPassword({ email: req.body.email });
    res.status(200).json({ message: 'If the account exists, a reset email was sent' });
  },

  async resetPassword(req, res) {
    await AuthService.resetPassword({
      token: req.body.token,
      newPassword: req.body.newPassword,
    });
    res.status(200).json({ message: 'Password reset successfully' });
  },

  async changePassword(req, res) {
    await AuthService.changePassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    res.status(200).json({ message: 'Password changed successfully' });
  },

  async listSessions(req, res) {
    const sessions = await AuthService.listSessions(req.user.id);
    res.status(200).json({ sessions });
  },

  async revokeSession(req, res) {
    await AuthService.revokeSession({
      userId: req.user.id,
      sessionId: req.params.sessionId,
    });
    res.status(204).send();
  },
};


module.exports=AuthController;