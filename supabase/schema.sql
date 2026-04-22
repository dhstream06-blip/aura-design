create table if not exists public.flyers (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.flyers enable row level security;

create policy "public read flyers"
  on public.flyers
  for select
  to anon
  using (true);

create policy "public insert flyers"
  on public.flyers
  for insert
  to anon
  with check (true);
