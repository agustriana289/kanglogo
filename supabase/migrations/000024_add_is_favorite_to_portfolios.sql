-- ============================================================
-- 000024_add_is_favorite_to_portfolios.sql
-- Add is_favorite column to store_portfolios for marking favorites
-- ============================================================

ALTER TABLE public.store_portfolios ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
