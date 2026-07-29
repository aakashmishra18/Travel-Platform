-- user-service schema
-- NOTE: user_id throughout refers to the auth-service user id (auth_users.id).
-- No FK constraint across services (separate databases) — integrity is
-- enforced at the application layer via the verified JWT's `sub` claim.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Profile (1:1 with an auth-service user)
-- ---------------------------------------------------------------------
CREATE TABLE user_profiles (
  user_id           UUID PRIMARY KEY,
  first_name        TEXT,
  last_name         TEXT,
  date_of_birth     DATE,
  gender            TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
  phone             TEXT,
  profile_image_url TEXT,
  profile_status    TEXT NOT NULL DEFAULT 'ACTIVE'
                      CHECK (profile_status IN ('ACTIVE', 'PENDING_DELETION', 'ANONYMIZED')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Travellers (people a user books for — including themselves)
-- ---------------------------------------------------------------------
CREATE TABLE travellers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,           -- owner / account that manages this traveller
  type          TEXT NOT NULL CHECK (type IN ('ADULT', 'CHILD', 'INFANT')),
  relationship  TEXT NOT NULL CHECK (relationship IN ('SELF', 'FAMILY', 'FRIEND', 'OTHER')),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  date_of_birth DATE,
  gender        TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
  nationality   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_travellers_user ON travellers(user_id);

-- Only one SELF traveller per user
CREATE UNIQUE INDEX idx_travellers_one_self_per_user
  ON travellers(user_id)
  WHERE relationship = 'SELF';

-- ---------------------------------------------------------------------
-- Traveller documents (passport etc.) — sensitive, encrypted at rest
-- ---------------------------------------------------------------------
CREATE TABLE traveller_documents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveller_id            UUID NOT NULL REFERENCES travellers(id) ON DELETE CASCADE,
  document_type           TEXT NOT NULL CHECK (document_type IN ('PASSPORT', 'VISA', 'NATIONAL_ID', 'OTHER')),
  -- Encrypted with pgcrypto (pgp_sym_encrypt) using an app-supplied key;
  -- never store or log the plaintext number. See document.repository.js.
  document_number_enc     BYTEA NOT NULL,
  document_number_last4   TEXT,          -- safe to display, e.g. "****1234"
  issue_country           TEXT,
  nationality             TEXT,
  issue_date              DATE,
  expiry_date             DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_traveller ON traveller_documents(traveller_id);

-- ---------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------
CREATE TABLE user_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('HOME', 'BILLING', 'WORK', 'GST')),
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT,
  state        TEXT,
  postal_code  TEXT,
  country      TEXT,
  company_name TEXT,       -- for GST/company addresses
  gst_number   TEXT,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON user_addresses(user_id);

-- ---------------------------------------------------------------------
-- Saved contacts (distinct from Auth Service's login email)
-- ---------------------------------------------------------------------
CREATE TABLE saved_contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('EMAIL', 'PHONE', 'EMERGENCY')),
  value      TEXT NOT NULL,
  label      TEXT,          -- e.g. "Mom", "Work"
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contacts_user ON saved_contacts(user_id);

-- ---------------------------------------------------------------------
-- Preferences (one row per user)
-- ---------------------------------------------------------------------
CREATE TABLE user_preferences (
  user_id             UUID PRIMARY KEY,
  language            TEXT DEFAULT 'en',
  currency            TEXT DEFAULT 'INR',
  timezone            TEXT DEFAULT 'Asia/Kolkata',
  flight_seat         TEXT,
  flight_meal         TEXT,
  flight_class        TEXT,
  hotel_room_pref     TEXT,
  hotel_accessibility TEXT,
  rail_berth          TEXT,
  rail_class          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Settings (accessibility / display / regional — flexible, so JSONB)
-- ---------------------------------------------------------------------
CREATE TABLE user_settings (
  user_id             UUID PRIMARY KEY,
  accessibility       JSONB NOT NULL DEFAULT '{}',
  display             JSONB NOT NULL DEFAULT '{}',
  regional            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Loyalty programs
-- ---------------------------------------------------------------------
CREATE TABLE loyalty_programs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  program_type      TEXT NOT NULL CHECK (program_type IN ('AIRLINE', 'HOTEL', 'RAIL')),
  provider_name     TEXT NOT NULL,     -- e.g. "IndiGo", "Marriott Bonvoy"
  membership_number TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_user ON loyalty_programs(user_id);

-- ---------------------------------------------------------------------
-- Consents (append-only style: new row per accept/revoke event optional;
-- here modeled as current-state-per-type for simplicity)
-- ---------------------------------------------------------------------
CREATE TABLE user_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN
                  ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'MARKETING_EMAIL', 'MARKETING_SMS')),
  status       TEXT NOT NULL CHECK (status IN ('GRANTED', 'REVOKED')),
  version      TEXT NOT NULL,
  accepted_at  TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type, version)
);
CREATE INDEX idx_consents_user ON user_consents(user_id);
