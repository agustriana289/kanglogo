-- Add SEO and Payment Method configuration settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS seo_keywords text DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_author text DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_meta_robots text DEFAULT 'index, follow',
ADD COLUMN IF NOT EXISTS seo_canonical_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_og_title text DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_og_description text DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_og_image text DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_og_type text DEFAULT 'website',
ADD COLUMN IF NOT EXISTS seo_twitter_card text DEFAULT 'summary_large_image',
ADD COLUMN IF NOT EXISTS seo_twitter_title text DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_twitter_description text DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_twitter_handle text DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]'::jsonb;
