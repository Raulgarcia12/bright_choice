-- Migration: Add seller_name to products table
-- This allows tracking the retailer/seller (e.g., BulbsDepot, Green Lighting Wholesale)
-- separately from the actual product brand.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_name TEXT;
