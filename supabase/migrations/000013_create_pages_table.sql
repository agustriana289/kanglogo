create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text,
  meta_description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pages enable row level security;

create policy "Anyone can read published pages"
  on pages for select
  using (is_published = true);

create policy "Admins can manage pages"
  on pages for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );
