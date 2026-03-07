-- Migration to add Landing Page content settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS hero_badge text DEFAULT 'Fast, Premium Logo Design',
ADD COLUMN IF NOT EXISTS hero_title text DEFAULT 'Design your brand''s perfect identity',
ADD COLUMN IF NOT EXISTS hero_description text DEFAULT 'Professional logo design that speaks to your audience. We build visual identities that are memorable, scalable, and fast to deliver. Start your new chapter today.',
ADD COLUMN IF NOT EXISTS features_list jsonb DEFAULT '[
  {"title": "Lightning Fast", "desc": "Get your initial logo concepts in less than 24 hours.", "icon": "Rocket"},
  {"title": "Premium Quality", "desc": "Crafted by expert designers with years of branding experience.", "icon": "Sparkles"},
  {"title": "Unlimited Revisions", "desc": "We are not happy until you are. Tweak it until it''s perfect.", "icon": "CheckCircle2"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS trusted_by_title text DEFAULT 'Trusted by 5,000+ ambitious brands',
ADD COLUMN IF NOT EXISTS trusted_by_description text DEFAULT 'From stealth startups to global enterprises, we deliver world-class visual identities that command attention.',
ADD COLUMN IF NOT EXISTS stats_title text DEFAULT 'Join the club',
ADD COLUMN IF NOT EXISTS stats_list jsonb DEFAULT '[
  {"value": "24", "suffix": "h", "label": "Average Delivery"},
  {"value": "∞", "suffix": "", "label": "Free Revisions"},
  {"value": "200", "suffix": "+", "label": "Five-star reviews"},
  {"value": "99", "suffix": "%", "label": "Client Satisfaction"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS portfolio_badge text DEFAULT 'View Our Work',
ADD COLUMN IF NOT EXISTS portfolio_title text DEFAULT 'Recent Masterpieces',
ADD COLUMN IF NOT EXISTS portfolio_description text DEFAULT 'A glimpse into the visual identities we''ve crafted for brands around the globe. Click any image to view details.',
ADD COLUMN IF NOT EXISTS pricing_badge text DEFAULT 'Clear Pricing',
ADD COLUMN IF NOT EXISTS pricing_title text DEFAULT 'Simple, transparent pricing',
ADD COLUMN IF NOT EXISTS pricing_description text DEFAULT 'No hidden fees. No surprise charges. Choose the plan that best fits your brand''s needs.',
ADD COLUMN IF NOT EXISTS process_badge text DEFAULT 'Our Process',
ADD COLUMN IF NOT EXISTS process_title text DEFAULT '4 simple steps to launch',
ADD COLUMN IF NOT EXISTS process_description text DEFAULT 'We''ve eliminated the friction from traditional agency models. Here is how we deliver world-class identities so quickly.',
ADD COLUMN IF NOT EXISTS process_list jsonb DEFAULT '[
  {"title": "Step 1: Discovery", "desc": "Fill out a quick brief about your brand''s vision, target audience, and style preferences.", "icon": "Search"},
  {"title": "Step 2: Ideation", "desc": "Our expert designers craft multiple unique, initial logo concepts within 24-48 hours.", "icon": "Lightbulb"},
  {"title": "Step 3: Refinement", "desc": "We work closely with you to tweak, revise, and perfect your chosen design direction.", "icon": "Edit3"},
  {"title": "Step 4: Delivery", "desc": "Receive all your high-res, vector, and source files ready for web and print.", "icon": "DownloadCloud"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS case_studies_title text DEFAULT 'More Case Studies',
ADD COLUMN IF NOT EXISTS case_studies_description text DEFAULT 'A curated collection of our finest brand identity projects.',
ADD COLUMN IF NOT EXISTS faq_badge text DEFAULT 'Got Questions?',
ADD COLUMN IF NOT EXISTS faq_title text DEFAULT 'Frequently asked questions',
ADD COLUMN IF NOT EXISTS faq_description text DEFAULT 'If you can''t find what you''re looking for, feel free to contact our support team.',
ADD COLUMN IF NOT EXISTS cta_title text DEFAULT 'Ready to elevate your brand?',
ADD COLUMN IF NOT EXISTS cta_description text DEFAULT 'Join thousands of successful businesses who trust us with their visual identity. Start your project today and get your initial concepts in as little as 24 hours.',
ADD COLUMN IF NOT EXISTS cta_button1_text text DEFAULT 'Let''s get started',
ADD COLUMN IF NOT EXISTS cta_button2_text text DEFAULT 'Talk to our team',
ADD COLUMN IF NOT EXISTS blog_badge text DEFAULT 'Our Blog',
ADD COLUMN IF NOT EXISTS blog_title text DEFAULT 'Latest insights',
ADD COLUMN IF NOT EXISTS blog_description text DEFAULT 'Expert advice, design principles, and strategies to help your brand stand out in a crowded market.';
