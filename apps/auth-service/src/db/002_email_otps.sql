-- Adds OTP-based email verification, sent automatically on registration.
-- This lives alongside (does not remove) the existing link-based
-- email_verification_tokens flow — you can keep both or drop the old
-- one later once OTP is confirmed working.

CREATE TABLE email_otps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  otp_hash    TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_otps_user ON email_otps(user_id);
