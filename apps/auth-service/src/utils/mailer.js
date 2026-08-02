const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.email.gmailUser,
    pass: env.email.gmailAppPassword,
  },
});

module.exports = transporter;