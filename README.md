# Aura Design (Next.js + Supabase)

A polished single-page flyer wall:
- centered logo + clean hero section
- upload image to Supabase Storage bucket
- save public image URL in Supabase table
- everyone can view uploaded images

## 1) Install & run

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 2) Supabase setup

In Supabase SQL editor, run:

```sql
-- see full file in supabase/schema.sql
create table if not exists public.flyers (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  created_at timestamptz not null default now()
);
```

Then create a **public** storage bucket called `flyers`.

Add `.env.local` values:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3) Storage policies (required)

In Supabase Storage policies for bucket `flyers`:
- allow `anon` to `SELECT`
- allow `anon` to `INSERT`

This matches your request: upload once, image stays, and everyone can see it.
