-- Create the global settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id integer primary key default 1,
  
  -- Tab 1: Website Settings
  website_name text default 'Kanglogo',
  email text default 'admin@kanglogo.com',
  phone_number text default '+6280000000',
  description text,
  is_maintenance boolean default false,
  favicon_url text,
  logo_url text,
  color_primary text default '#4f46e5',
  color_secondary text default '#6366f1',
  color_theme1 text default '#ffffff',
  color_theme2 text default '#000000',

  -- Future Tabs (Navigation, Landing, Header, Footer, Seo, Payment) will be added here via migrations later

  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure only one row exists (id = 1)
ALTER TABLE public.settings ADD CONSTRAINT settings_single_row CHECK (id = 1);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies for settings
-- 1. Anyone can view the settings (needed for frontend UI rendering)
CREATE POLICY "Anyone can view settings" ON public.settings
  FOR SELECT USING (true);

-- 2. Only Admins can Update
CREATE POLICY "Only admins can update settings" ON public.settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- 3. Only Admins can Insert
CREATE POLICY "Only admins can insert settings" ON public.settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Insert the default starting row
INSERT INTO public.settings (id, website_name) 
VALUES (1, 'Kanglogo') 
ON CONFLICT (id) DO NOTHING;
