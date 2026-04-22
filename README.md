# Aura Design — GitHub Hosted + Supabase

Diese Version bleibt statisch für **GitHub Pages** Hosting.

## Setup (nur URL + Token eintragen)

1. `config.js` öffnen.
2. Eintragen:

```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_PUBLIC_ANON_KEY'
};
```

3. Auf GitHub pushen und weiter über GitHub Pages hosten.

## Supabase nötig

### SQL (Table + Policies)

```sql
create table if not exists public.flyers (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.flyers enable row level security;

create policy "public read flyers" on public.flyers for select to anon using (true);
create policy "public insert flyers" on public.flyers for insert to anon with check (true);
```

### Storage

- Bucket name: `flyers` (public)
- Policies: `anon` darf `SELECT` + `INSERT`

Danach: Bild hochladen => bleibt gespeichert und alle sehen es.
