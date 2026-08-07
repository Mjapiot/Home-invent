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
