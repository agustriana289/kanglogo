-- Migration to add Navigation Links to the settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS header_links jsonb DEFAULT '[
  {"label": "Features", "url": "#features"},
  {"label": "Portfolio", "url": "#portfolio"},
  {"label": "Pricing", "url": "#pricing"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS footer_services_links jsonb DEFAULT '[
  {"label": "Logo Design", "url": "#"},
  {"label": "Brand Identity", "url": "#"},
  {"label": "Brand Guidelines", "url": "#"},
  {"label": "Stationery Design", "url": "#"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS footer_company_links jsonb DEFAULT '[
  {"label": "About Us", "url": "#"},
  {"label": "Our Process", "url": "#"},
  {"label": "Portfolio", "url": "#"},
  {"label": "Contact", "url": "#"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS footer_legal_links jsonb DEFAULT '[
  {"label": "Privacy Policy", "url": "#"},
  {"label": "Terms of Service", "url": "#"},
  {"label": "Refund Policy", "url": "#"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS footer_bottom_links jsonb DEFAULT '[
  {"label": "Privacy", "url": "#"},
  {"label": "Terms", "url": "#"},
  {"label": "Cookies", "url": "#"}
]'::jsonb;
