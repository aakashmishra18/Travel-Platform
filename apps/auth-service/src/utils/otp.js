const crypto = require("crypto");

/**
 * Generates a numeric OTP of the given length as a string (e.g. "483920").
 * Uses crypto.randomInt for a cryptographically strong random number,
 * not Math.random().
 */
function generateOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * One-way hash of the OTP for storage — never store the plaintext OTP,
 * same principle as password/refresh-token hashing elsewhere in this
 * service. SHA-256 is fine here (unlike passwords) since OTPs are
 * short-lived, single-use, and rate-limited against brute force via
 * the `attempts` counter — they don't need bcrypt's slow-hash property.
 */
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

module.exports = { generateOtp, hashOtp };