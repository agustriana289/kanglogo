create table if not exists public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  type text not null default 'info',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.site_announcements enable row level security;

create policy "Public can view active announcements"
  on public.site_announcements for select
  using (is_active = true);

create policy "Admins can manage announcements"
  on public.site_announcements for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );
