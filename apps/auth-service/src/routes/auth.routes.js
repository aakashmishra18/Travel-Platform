const express = require('express');
const AuthController = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { loginLimiter } = require('../middleware/rateLimiter');
const schemas = require('../validators/auth.validators');

const router = express.Router();

// Public (proxied by API Gateway, no end-user auth yet)
router.post('/register', validate(schemas.register), asyncHandler(AuthController.register));

router.post(
  '/login',
  loginLimiter,
  validate(schemas.login),
  asyncHandler(AuthController.login)
);

router.post('/refresh', validate(schemas.refresh), asyncHandler(AuthController.refresh));

router.post(
  '/verify-email',
  validate(schemas.verifyEmail),
  asyncHandler(AuthController.verifyEmail)
);

router.post(
  '/resend-verification',
  loginLimiter,
  validate(schemas.resendVerification),
  asyncHandler(AuthController.resendVerification)
);

router.post(
  '/forgot-password',
  loginLimiter,
  validate(schemas.forgotPassword),
  asyncHandler(AuthController.forgotPassword)
);

router.post(
  '/reset-password',
  validate(schemas.resetPassword),
  asyncHandler(AuthController.resetPassword)
);

// Authenticated (requires a valid access token)
router.post(
  '/logout',
  authenticate,
  validate(schemas.logout),
  asyncHandler(AuthController.logout)
);

router.post('/logout-all', authenticate, asyncHandler(AuthController.logoutAll));

router.get('/me', authenticate, asyncHandler(AuthController.me));

router.post(
  '/change-password',
  authenticate,
  validate(schemas.changePassword),
  asyncHandler(AuthController.changePassword)
);

router.get('/sessions', authenticate, asyncHandler(AuthController.listSessions));

router.delete(
  '/sessions/:sessionId',
  authenticate,
  validate(schemas.sessionIdParam, 'params'),
  asyncHandler(AuthController.revokeSession)
);

module.exports = router;