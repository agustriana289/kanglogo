-- Add header configuration settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS header_size text DEFAULT 'md',
ADD COLUMN IF NOT EXISTS header_sticky boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS header_transparent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS header_bg_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS header_bg_opacity numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS header_custom_html text DEFAULT '';
