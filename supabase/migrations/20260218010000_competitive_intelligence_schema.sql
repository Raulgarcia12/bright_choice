-- =============================================================
-- Migration: Competitive Intelligence Platform Schema
-- Description: Extends the existing Bright Choice schema with
--   tables for brands, product versioning, change tracking,
--   scraping audit trail, and extended roles.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTEND ROLES ENUM
-- ─────────────────────────────────────────────────────────────
-- Add 'analyst' and 'viewer' roles. Migrate existing 'user' → 'viewer'.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analyst';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- After deploying this migration, run the following to migrate existing users:
-- UPDATE public.user_roles SET role = 'viewer' WHERE role = 'user';

-- ─────────────────────────────────────────────────────────────
-- 2. BRANDS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website_url TEXT,
  logo_url TEXT,
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scraper_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.brands IS 'Lighting manufacturers tracked by the platform';
COMMENT ON COLUMN public.brands.scraper_config IS 'JSON config for the brand-specific scraper (selectors, URLs, etc.)';

-- ─────────────────────────────────────────────────────────────
-- 3. ADD brand_id TO PRODUCTS (linking to brands table)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id),
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS product_url TEXT,
  ADD COLUMN IF NOT EXISTS spec_hash TEXT,
  ADD COLUMN IF NOT EXISTS ip_rating TEXT,
  ADD COLUMN IF NOT EXISTS dimming TEXT,
  ADD COLUMN IF NOT EXISTS voltage TEXT,
  ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;

COMMENT ON COLUMN public.products.spec_hash IS 'SHA-256 hash of the normalized spec snapshot for change detection';
COMMENT ON COLUMN public.products.last_scraped_at IS 'Timestamp of the last successful scrape for this product';

-- ─────────────────────────────────────────────────────────────
-- 4. PRODUCT VERSIONS (change history)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.product_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  spec_hash TEXT NOT NULL,
  change_summary TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (product_id, version_number)
);

COMMENT ON TABLE public.product_versions IS 'Immutable snapshots of product specs at each version';

-- ─────────────────────────────────────────────────────────────
-- 5. PRODUCT ATTRIBUTES (normalized EAV model for flexible specs)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  unit TEXT,
  source_field_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (product_id, attribute_name)
);

COMMENT ON TABLE public.product_attributes IS 'Flexible key-value specs not in the core products columns';

-- ─────────────────────────────────────────────────────────────
-- 6. SCRAPE RUNS (orchestration tracking)
-- ─────────────────────────────────────────────────────────────

CREATE TYPE public.scrape_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TABLE public.scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  status public.scrape_status NOT NULL DEFAULT 'pending',
  products_found INTEGER DEFAULT 0,
  products_new INTEGER DEFAULT 0,
  products_changed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.scrape_runs IS 'Tracks each scraper execution for monitoring and auditing';

-- ─────────────────────────────────────────────────────────────
-- 7. RAW SCRAPED DATA (audit trail)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.raw_scraped_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_run_id UUID NOT NULL REFERENCES public.scrape_runs(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text/html',
  storage_path TEXT,
  raw_json JSONB,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.raw_scraped_data IS 'Raw HTML/JSON from scraper runs, stored for audit and re-processing';

-- ─────────────────────────────────────────────────────────────
-- 8. CHANGE LOGS (field-level diffs)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_version_id UUID REFERENCES public.product_versions(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.change_logs IS 'Field-level change records for products detected by the scraper';

-- ─────────────────────────────────────────────────────────────
-- 9. INDEXES
-- ─────────────────────────────────────────────────────────────

-- Products
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_spec_hash ON public.products(spec_hash);
CREATE INDEX IF NOT EXISTS idx_products_brand_model ON public.products(brand, model);

-- Product versions
CREATE INDEX IF NOT EXISTS idx_product_versions_product_id ON public.product_versions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_versions_product_version ON public.product_versions(product_id, version_number DESC);

-- Change logs
CREATE INDEX IF NOT EXISTS idx_change_logs_product_id ON public.change_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_detected_at ON public.change_logs(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_logs_product_detected ON public.change_logs(product_id, detected_at DESC);

-- Scrape runs
CREATE INDEX IF NOT EXISTS idx_scrape_runs_brand_id ON public.scrape_runs(brand_id);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_started_at ON public.scrape_runs(started_at DESC);

-- Raw scraped data
CREATE INDEX IF NOT EXISTS idx_raw_scraped_data_run_id ON public.raw_scraped_data(scrape_run_id);

-- Product attributes
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON public.product_attributes(product_id);

-- ─────────────────────────────────────────────────────────────
-- 10. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_scraped_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;

-- Brands: public read, admin write
CREATE POLICY "Anyone can read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins can insert brands" ON public.brands FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update brands" ON public.brands FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete brands" ON public.brands FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Product versions: public read
CREATE POLICY "Anyone can read product_versions" ON public.product_versions FOR SELECT USING (true);
CREATE POLICY "Service can insert product_versions" ON public.product_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Product attributes: public read
CREATE POLICY "Anyone can read product_attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Service can manage product_attributes" ON public.product_attributes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Scrape runs: analyst+ can read, admin can write
CREATE POLICY "Analysts can read scrape_runs" ON public.scrape_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admins can manage scrape_runs" ON public.scrape_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Raw scraped data: admin only
CREATE POLICY "Admins can read raw_scraped_data" ON public.raw_scraped_data FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage raw_scraped_data" ON public.raw_scraped_data FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Change logs: analyst+ can read
CREATE POLICY "Analysts can read change_logs" ON public.change_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Service can insert change_logs" ON public.change_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────
-- 11. TRIGGERS (updated_at on brands)
-- ─────────────────────────────────────────────────────────────

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 12. HELPER VIEWS
-- ─────────────────────────────────────────────────────────────

-- Dashboard metrics view: aggregated KPIs per brand
CREATE OR REPLACE VIEW public.brand_metrics AS
SELECT
  b.id AS brand_id,
  b.name AS brand_name,
  COUNT(p.id) AS product_count,
  ROUND(AVG(p.efficiency), 1) AS avg_efficiency,
  ROUND(AVG(p.price), 2) AS avg_price,
  ROUND(AVG(p.cri), 0) AS avg_cri,
  ROUND(AVG(p.lumens), 0) AS avg_lumens,
  ROUND(AVG(p.watts), 1) AS avg_watts,
  MAX(p.updated_at) AS last_updated
FROM public.brands b
LEFT JOIN public.products p ON p.brand_id = b.id
GROUP BY b.id, b.name;

-- Recent changes view
CREATE OR REPLACE VIEW public.recent_changes AS
SELECT
  cl.id,
  cl.field_name,
  cl.old_value,
  cl.new_value,
  cl.detected_at,
  p.brand,
  p.model,
  p.category,
  b.name AS brand_name
FROM public.change_logs cl
JOIN public.products p ON p.id = cl.product_id
LEFT JOIN public.brands b ON b.id = p.brand_id
ORDER BY cl.detected_at DESC;
