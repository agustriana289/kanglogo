-- 000016_add_key_features_to_store.sql
ALTER TABLE public.store_services ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '[]'::jsonb;
