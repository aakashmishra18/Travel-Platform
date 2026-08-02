const express = require('express');
const Joi = require('joi');

const AuthController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');   // exports `authenticate`, per auth.middleware.js
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// ---------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  deviceName: Joi.string().max(100),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const emailOnlySchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const forgotPasswordSchema = emailOnlySchema;

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const sessionIdParamSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
});

// ---------------------------------------------------------------------
// Public routes — no access token required
// ---------------------------------------------------------------------
router.post('/register', validate(registerSchema), asyncHandler(AuthController.register));
router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(AuthController.refresh));

router.post('/verify-email', validate(verifyEmailSchema), asyncHandler(AuthController.verifyEmail));
router.post('/resend-verification', validate(emailOnlySchema), asyncHandler(AuthController.resendVerification));

// New: OTP-based email verification, sent automatically at registration.
router.post('/verify-otp', validate(verifyOtpSchema), asyncHandler(AuthController.verifyOtp));
router.post('/resend-otp', validate(emailOnlySchema), asyncHandler(AuthController.resendOtp));

router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(AuthController.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(AuthController.resetPassword));

// ---------------------------------------------------------------------
// Protected routes — require a valid access token
// ---------------------------------------------------------------------
router.get('/me', authenticate, asyncHandler(AuthController.me));

router.post('/logout', authenticate, validate(logoutSchema), asyncHandler(AuthController.logout));
router.post('/logout-all', authenticate, asyncHandler(AuthController.logoutAll));

router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(AuthController.changePassword)
);

router.get('/sessions', authenticate, asyncHandler(AuthController.listSessions));
router.delete(
  '/sessions/:sessionId',
  authenticate,
  validate(sessionIdParamSchema, 'params'),
  asyncHandler(AuthController.revokeSession)
);

module.exports = router;
