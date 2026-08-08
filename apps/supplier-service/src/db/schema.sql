-- Travel OS :: Supplier Service :: PostgreSQL Schema
-- Logical database ownership: supplier-service owns this schema exclusively.
--
-- supplier_offers is the durable cache behind every offerId this service
-- hands out. Search results (from Mock/Duffel/Amadeus) are normalized
-- into one shape and stored here so later calls — GET offer, revalidate,
-- availability, fare-rules, book — can look the offer back up without
-- re-querying the origin provider every time.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- supplier_offers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplier_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    provider_offer_id TEXT,          -- the provider's own raw offer id, if any (null for MOCK)
    origin CHAR(3) NOT NULL,
    destination CHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    cabin_class TEXT NOT NULL,
    price_amount NUMERIC(10,2) NOT NULL,
    price_currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    payload JSONB NOT NULL,          -- the full normalized offer object returned to callers
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_offers_provider
        CHECK (provider IN ('MOCK', 'DUFFEL', 'AMADEUS')),
    CONSTRAINT chk_offers_status
        CHECK (status IN ('ACTIVE', 'EXPIRED', 'BOOKED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_offers_route ON supplier_offers(origin, destination, departure_date);
CREATE INDEX IF NOT EXISTS idx_offers_status ON supplier_offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_expires ON supplier_offers(expires_at);

-- ---------------------------------------------------------------------------
-- supplier_bookings
-- Booking Service (not yet built) will eventually call POST
-- /internal/flights/book after payment is confirmed. This table exists
-- now so that flow has somewhere to land — every field here maps
-- directly to what the design doc's "Book Flight" step returns.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplier_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES supplier_offers(id),
    provider TEXT NOT NULL,
    pnr TEXT,
    ticket_number TEXT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    passengers JSONB NOT NULL,
    cancellation_fee NUMERIC(10,2),
    refund_amount NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_bookings_status
        CHECK (status IN ('CONFIRMED', 'CANCELLED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_offer ON supplier_bookings(offer_id);
