-- Add company and location to public.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS company text DEFAULT 'Unknown Company',
ADD COLUMN IF NOT EXISTS location text DEFAULT 'Indonesia';

-- Create user_activities table for the timeline
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  highlight text,
  highlight_color text default 'text-slate-900',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Policies for user_activities
-- 1. Anyone can view public user activities
CREATE POLICY "Activities are viewable by everyone." ON public.user_activities
  FOR SELECT USING (true);

-- 2. Users can only create their own activities
CREATE POLICY "Users can insert their own activities." ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
