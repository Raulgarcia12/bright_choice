-- ============================================================
-- Migration: Add retailers and retailer_prices tables
-- Purpose:  Enable multi-vendor pricing and market intelligence
-- ============================================================

-- 1. Retailers table — distributors/resellers of LED products
CREATE TABLE IF NOT EXISTS retailers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    address         TEXT,
    city            TEXT,
    state_province  TEXT NOT NULL,
    country         TEXT NOT NULL DEFAULT 'USA',
    phone           TEXT,
    website_url     TEXT,
    inventory_count INT DEFAULT 0,
    primary_brands  TEXT[],
    reported_clients JSONB DEFAULT '[]'::jsonb,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_retailers_state
    ON retailers (state_province);
CREATE INDEX IF NOT EXISTS idx_retailers_country
    ON retailers (country);

-- 2. Retailer prices — one product can have many prices from different vendors
CREATE TABLE IF NOT EXISTS retailer_prices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    retailer_id       UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    unit_price        NUMERIC(10,2) NOT NULL,
    currency          TEXT DEFAULT 'USD',
    is_available      BOOLEAN DEFAULT true,
    last_verified_at  TIMESTAMPTZ DEFAULT now(),
    created_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, retailer_id)
);

-- Indexes for joins and filtering
CREATE INDEX IF NOT EXISTS idx_retailer_prices_product
    ON retailer_prices (product_id);
CREATE INDEX IF NOT EXISTS idx_retailer_prices_retailer
    ON retailer_prices (retailer_id);

-- 3. Enable RLS (Row Level Security) — public read, authenticated write
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailer_prices ENABLE ROW LEVEL SECURITY;

-- Public can read retailers
CREATE POLICY "Public can read retailers"
    ON retailers FOR SELECT
    USING (true);

-- Public can read retailer prices
CREATE POLICY "Public can read retailer_prices"
    ON retailer_prices FOR SELECT
    USING (true);

-- Authenticated users can insert/update retailers
CREATE POLICY "Authenticated can manage retailers"
    ON retailers FOR ALL
    USING (auth.role() = 'authenticated');

-- Authenticated users can insert/update retailer_prices
CREATE POLICY "Authenticated can manage retailer_prices"
    ON retailer_prices FOR ALL
    USING (auth.role() = 'authenticated');

-- 4. Seed data: Green Lighting Wholesale (Ohio — case study)
INSERT INTO retailers (
    name, address, city, state_province, country,
    inventory_count, primary_brands, reported_clients
) VALUES (
    'Green Lighting Wholesale',
    '405 S 22nd St',
    'Heath',
    'OH',
    'USA',
    4900,
    ARRAY['Maxlite'],
    '[
        {"name": "Lindsay Honda Design Build"},
        {"name": "South Bend FedEx Fulfillment"},
        {"name": "City of Gahanna - LED Canopy"},
        {"name": "City of Gahanna Parking Garage"},
        {"name": "Crossfit OKM of Gahanna"},
        {"name": "Dayco Appliance Parts"}
    ]'::jsonb
);
