-- Extensions
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- Wrapper immutable pour indexer les recherches insensibles aux accents
create or replace function public.f_unaccent(text) returns text
  language sql immutable parallel safe strict
  as $$ select public.unaccent('public.unaccent', $1) $$;

-- Maisons
create table public.homes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default '🏠',
  created_at timestamptz not null default now()
);

-- Pièces
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default '🚪',
  sort_order int not null default 0
);

-- Taxonomie globale (lecture seule, seedée en 0004)
create table public.categories (
  id text primary key,
  name_fr text not null,
  icon text not null,
  tracks_expiry boolean not null default false
);

-- Items d'inventaire
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  category_id text references public.categories(id),
  name text not null,
  brand text,
  quantity numeric not null default 1,
  unit text not null default 'pcs',
  barcode text,
  photo_path text,
  expiry_date date,
  notes text,
  attributes jsonb not null default '{}',
  status text not null default 'in_stock' check (status in ('in_stock','low','out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cache des lookups code-barres (écrit via la route serveur, clé anon suffit :
-- pas de données utilisateur, lecture/écriture authentifiée)
create table public.product_cache (
  barcode text primary key,
  source text not null,
  payload jsonb, -- null = lookup en échec (miss mis en cache)
  fetched_at timestamptz not null default now()
);

-- updated_at automatique
create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();
