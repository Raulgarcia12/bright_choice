-- Add state_province column to products for direct map integration
-- This allows each product to be associated with a specific US state or Canadian province
-- (e.g. 'TX', 'CA', 'ON') which feeds directly into the dashboard choropleth map.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS state_province text DEFAULT NULL;

-- Index for fast map aggregation queries
CREATE INDEX IF NOT EXISTS idx_products_state_province ON public.products (state_province);

COMMENT ON COLUMN public.products.state_province IS
  'Two-letter US state or Canadian province abbreviation (e.g. TX, CA, ON). Used by the dashboard choropleth map.';
