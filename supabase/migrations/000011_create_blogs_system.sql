create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  featured_image text,
  category text,
  meta_title text,
  meta_description text,
  meta_keywords text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blogs enable row level security;

create policy "Public can read published blogs"
  on public.blogs
  for select
  using (is_published = true);

create policy "Admin can manage blogs"
  on public.blogs
  for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );
