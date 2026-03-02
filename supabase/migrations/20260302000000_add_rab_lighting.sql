-- =============================================================
-- Migration: Add RAB Lighting to brands table
-- =============================================================

INSERT INTO public.brands (name, website_url, is_active)
VALUES ('RAB Lighting', 'https://www.rablighting.com', true)
ON CONFLICT (name) DO NOTHING;
