-- Create a custom users table to store our user management data
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  is_admin boolean default false, -- Default is false. Manual override needed for the first admin.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS) to enforce data security
alter table public.users enable row level security;

-- Policies
-- 1. Anyone can view public user profiles (optional, adjust if you want it private)
create policy "User profiles are viewable by everyone." on public.users
  for select using (true);

-- 2. Users can only update their own profile
create policy "Users can update their own profile." on public.users
  for update using (auth.uid() = id);

-- Function to handle new user registration from Supabase Auth (e.g., Google OAuth)
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger that fires the function every time a user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- NOTE: To make an account an Admin, you can run this query manually later:
-- update public.users set is_admin = true where email = 'admin_email@example.com';
