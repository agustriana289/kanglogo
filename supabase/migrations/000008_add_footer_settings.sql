-- Add footer settings configuration
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS footer_description text DEFAULT 'Karna Logo Jangan Dibuat Biasa Saja',
ADD COLUMN IF NOT EXISTS footer_social_links jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS footer_copyright text DEFAULT '© 2026 Kanglogo. All rights reserved.',
ADD COLUMN IF NOT EXISTS footer_custom_html text DEFAULT '';
