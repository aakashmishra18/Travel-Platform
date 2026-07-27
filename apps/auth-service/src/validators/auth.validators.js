const Joi = require('joi');

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Z]/, 'uppercase letter')
  .pattern(/[a-z]/, 'lowercase letter')
  .pattern(/[0-9]/, 'number')
  .required();

module.exports = {
  register: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: passwordRule,
  }),

  login: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().required(),
    deviceName: Joi.string().max(255).optional(),
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  logout: Joi.object({
    refreshToken: Joi.string().optional(),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required(),
  }),

  resendVerification: Joi.object({
    email: Joi.string().email().max(255).required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().max(255).required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: passwordRule,
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: passwordRule,
  }),

  sessionIdParam: Joi.object({
    sessionId: Joi.string().uuid().required(),
  }),
};