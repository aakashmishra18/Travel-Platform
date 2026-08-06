-- Travel OS :: Search Service :: PostgreSQL Schema
-- Logical database ownership: search-service owns this schema exclusively.
-- No other service may read/write these tables directly.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- airports: reference data powering autocomplete and search validation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airports (
    code CHAR(3) PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code CHAR(2) NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    timezone TEXT
);

CREATE INDEX IF NOT EXISTS idx_airports_city ON airports (LOWER(city));
CREATE INDEX IF NOT EXISTS idx_airports_country ON airports (country_code);

-- ---------------------------------------------------------------------------
-- search_logs: lightweight analytics trail. user_id is nullable — flight
-- search is public (no login required to browse); when a valid access
-- token IS presented, the caller is attached for later personalization
-- (recent searches, price-drop alerts, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    origin CHAR(3) NOT NULL,
    destination CHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER NOT NULL DEFAULT 0,
    infants INTEGER NOT NULL DEFAULT 0,
    cabin_class TEXT NOT NULL DEFAULT 'ECONOMY',
    result_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_search_logs_cabin_class
        CHECK (cabin_class IN ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS'))
);

CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_route ON search_logs(origin, destination);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at);

-- ---------------------------------------------------------------------------
-- Seed data — idempotent upsert so re-running the migration never
-- duplicates or errors on already-seeded airports.
-- ---------------------------------------------------------------------------
INSERT INTO airports (code, name, city, country, country_code, latitude, longitude, timezone) VALUES
    ('DEL', 'Indira Gandhi International Airport', 'Delhi', 'India', 'IN', 28.5562, 77.1000, 'Asia/Kolkata'),
    ('BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India', 'IN', 19.0896, 72.8656, 'Asia/Kolkata'),
    ('BLR', 'Kempegowda International Airport', 'Bengaluru', 'India', 'IN', 13.1986, 77.7066, 'Asia/Kolkata'),
    ('MAA', 'Chennai International Airport', 'Chennai', 'India', 'IN', 12.9941, 80.1709, 'Asia/Kolkata'),
    ('CCU', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'India', 'IN', 22.6547, 88.4467, 'Asia/Kolkata'),
    ('HYD', 'Rajiv Gandhi International Airport', 'Hyderabad', 'India', 'IN', 17.2403, 78.4294, 'Asia/Kolkata'),
    ('PNQ', 'Pune Airport', 'Pune', 'India', 'IN', 18.5822, 73.9197, 'Asia/Kolkata'),
    ('AMD', 'Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'India', 'IN', 23.0772, 72.6347, 'Asia/Kolkata'),
    ('GOI', 'Goa International Airport (Dabolim)', 'Goa', 'India', 'IN', 15.3808, 73.8314, 'Asia/Kolkata'),
    ('COK', 'Cochin International Airport', 'Kochi', 'India', 'IN', 10.1520, 76.4019, 'Asia/Kolkata'),
    ('JAI', 'Jaipur International Airport', 'Jaipur', 'India', 'IN', 26.8242, 75.8122, 'Asia/Kolkata'),
    ('LKO', 'Chaudhary Charan Singh International Airport', 'Lucknow', 'India', 'IN', 26.7606, 80.8893, 'Asia/Kolkata'),
    ('IXC', 'Chandigarh Airport', 'Chandigarh', 'India', 'IN', 30.6735, 76.7885, 'Asia/Kolkata'),
    ('PAT', 'Jay Prakash Narayan International Airport', 'Patna', 'India', 'IN', 25.5913, 85.0879, 'Asia/Kolkata'),
    ('DXB', 'Dubai International Airport', 'Dubai', 'UAE', 'AE', 25.2532, 55.3657, 'Asia/Dubai'),
    ('SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'SG', 1.3644, 103.9915, 'Asia/Singapore'),
    ('LHR', 'London Heathrow Airport', 'London', 'United Kingdom', 'GB', 51.4700, -0.4543, 'Europe/London'),
    ('JFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'US', 40.6413, -73.7781, 'America/New_York'),
    ('BKK', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'TH', 13.6900, 100.7501, 'Asia/Bangkok'),
    ('KUL', 'Kuala Lumpur International Airport', 'Kuala Lumpur', 'Malaysia', 'MY', 2.7456, 101.7099, 'Asia/Kuala_Lumpur')
ON CONFLICT (code) DO NOTHING;
