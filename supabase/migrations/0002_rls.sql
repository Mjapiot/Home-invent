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
