create table if not exists public.logo_fonts (
  id bigint primary key generated always as identity,
  font_name text not null,
  google_font_family text not null, -- e.g. "Open+Sans:wght@400;700" or just "Open Sans"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.logo_fonts enable row level security;

create policy "Public fonts are viewable by everyone."
  on public.logo_fonts for select
  using ( true );

create policy "Admins can insert fonts."
  on public.logo_fonts for insert
  to authenticated
  with check ( true );

create policy "Admins can update fonts."
  on public.logo_fonts for update
  to authenticated
  using ( true );

create policy "Admins can delete fonts."
  on public.logo_fonts for delete
  to authenticated
  using ( true );
