-- Migration: Expand product categories and relax cct constraint for scraper data
-- The existing category constraint only allows ('Bulb', 'Panel', 'High Bay').
-- Scrapers find many more product types on real manufacturer websites.
-- Also, not all products publish CCT on the listing page, so make it nullable.

-- 1. Expand the category CHECK constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products ADD CONSTRAINT products_category_check
  CHECK (category IN (
    'Bulb', 'Panel', 'High Bay',
    'Linear', 'Downlight', 'Flood Light',
    'Area Light', 'Canopy', 'Parking Structure',
    'Bollard', 'Wall Pack', 'Vapor Tight',
    'Surface Mount', 'Specialty', 'Troffer',
    'Street Light', 'Retrofit', 'Track Light'
  ));

-- 2. Allow CCT to be NULL (many products don't publish CCT in listing pages)
ALTER TABLE public.products ALTER COLUMN cct DROP NOT NULL;
ALTER TABLE public.products ALTER COLUMN cct SET DEFAULT NULL;
