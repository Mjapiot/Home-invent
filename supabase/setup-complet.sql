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
alter table public.homes enable row level security;
alter table public.rooms enable row level security;
alter table public.items enable row level security;
alter table public.categories enable row level security;
alter table public.product_cache enable row level security;

create policy "own homes" on public.homes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rooms" on public.rooms for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own items" on public.items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read categories" on public.categories for select
  to authenticated using (true);

-- Cache produits : partagé entre utilisateurs (données publiques OFF), pas de PII
create policy "read product cache" on public.product_cache for select
  to authenticated using (true);
create policy "write product cache" on public.product_cache for insert
  to authenticated with check (true);
create policy "update product cache" on public.product_cache for update
  to authenticated using (true);

-- Storage : bucket privé "item-photos", chemin {uid}/...
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', false)
on conflict (id) do nothing;

create policy "own photos insert" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own photos select" on storage.objects for select
  to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own photos update" on storage.objects for update
  to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own photos delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create index items_user_home_room_idx on public.items (user_id, home_id, room_id);
create index items_expiry_idx on public.items (user_id, expiry_date) where expiry_date is not null;
create index items_barcode_idx on public.items (user_id, barcode) where barcode is not null;
create index rooms_home_idx on public.rooms (home_id, sort_order);

-- Recherche française insensible aux accents et tolérante aux fautes
create index items_name_trgm_idx on public.items
  using gin (public.f_unaccent(lower(name)) gin_trgm_ops);
create index items_brand_trgm_idx on public.items
  using gin (public.f_unaccent(lower(brand)) gin_trgm_ops);

-- RPC de recherche avec filtres composables
create or replace function public.search_items(
  q text,
  p_home uuid default null,
  p_room uuid default null,
  p_cat text default null
) returns setof public.items
language sql stable
set search_path = public
as $$
  select * from public.items
  where user_id = auth.uid()
    and (p_home is null or home_id = p_home)
    and (p_room is null or room_id = p_room)
    and (p_cat is null or category_id = p_cat)
    and (
      q is null or q = ''
      or f_unaccent(lower(name)) like '%' || f_unaccent(lower(q)) || '%'
      or f_unaccent(lower(coalesce(brand, ''))) like '%' || f_unaccent(lower(q)) || '%'
    )
  order by
    case when q is null or q = '' then 0
         else similarity(f_unaccent(lower(name)), f_unaccent(lower(q))) end desc,
    updated_at desc
  limit 50;
$$;
insert into public.categories (id, name_fr, icon, tracks_expiry) values
  ('alimentaire',   'Alimentaire',      '🍝', true),
  ('boissons',      'Boissons',         '🍷', true),
  ('medicaments',   'Médicaments',      '💊', true),
  ('hygiene-beaute','Hygiène & Beauté', '🧴', true),
  ('entretien',     'Entretien',        '🧽', false),
  ('vetements',     'Vêtements',        '👗', false),
  ('linge',         'Linge de maison',  '🛏️', false),
  ('bricolage',     'Bricolage',        '🔧', false),
  ('electronique',  'Électronique',     '🔌', false),
  ('papeterie',     'Papeterie',        '✏️', false),
  ('autre',         'Autre',            '📦', false)
on conflict (id) do nothing;
