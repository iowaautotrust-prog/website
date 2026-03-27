-- ============================================================
-- Iowa Auto Trust — FINAL POLICY FIX
-- Run this ONE TIME in Supabase SQL Editor
-- Fixes all recursion, conflicts, and 500 errors permanently
-- ============================================================

-- ─── STEP 1: Helper functions (bypass RLS — no recursion) ────
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

create or replace function public.is_staff()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (is_admin = true or is_manager = true)
  );
$$;

-- ─── STEP 2: Drop ALL existing policies ──────────────────────
do $$ declare
  r record;
begin
  for r in (
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
  ) loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ─── STEP 3: Recreate all policies cleanly ───────────────────

-- PROFILES
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- SETTINGS
create policy "settings_select" on public.settings for select using (true);
create policy "settings_write"  on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- CATEGORIES
create policy "categories_select" on public.categories for select using (true);
create policy "categories_admin"  on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- VEHICLES
create policy "vehicles_select" on public.vehicles for select using (true);
create policy "vehicles_admin"  on public.vehicles for all using (public.is_staff()) with check (public.is_staff());

-- LEADS
create policy "leads_insert"       on public.leads for insert with check (true);
create policy "leads_admin_select" on public.leads for select using (public.is_staff());
create policy "leads_admin_update" on public.leads for update using (public.is_staff());

-- TRANSACTIONS
create policy "transactions_select" on public.transactions for select using (public.is_staff());
create policy "transactions_insert" on public.transactions for insert with check (true);
create policy "transactions_update" on public.transactions for update using (public.is_staff());

-- FAVORITES
create policy "favorites_all" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- VEHICLE_VIEWS
create policy "vehicle_views_all" on public.vehicle_views for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RECENT_SEARCHES
create policy "recent_searches_all" on public.recent_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- COUPONS
create policy "coupons_select" on public.coupons for select using (active = true);
create policy "coupons_admin"  on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- SHOP TABLES
create policy "shop_customers_all"  on public.shop_customers  for all using (public.is_staff()) with check (public.is_staff());
create policy "shop_vehicles_all"   on public.shop_vehicles   for all using (public.is_staff()) with check (public.is_staff());
create policy "service_jobs_all"    on public.service_jobs    for all using (public.is_staff()) with check (public.is_staff());
create policy "service_jobs_select" on public.service_jobs    for select using (true);
create policy "service_items_all"   on public.service_items   for all using (public.is_staff()) with check (public.is_staff());
create policy "service_items_select" on public.service_items  for select using (true);
create policy "shop_invoices_all"   on public.shop_invoices   for all using (public.is_staff()) with check (public.is_staff());
create policy "shop_invoices_select" on public.shop_invoices  for select using (true);
create policy "appointments_all"    on public.appointments    for all using (public.is_staff()) with check (public.is_staff());
create policy "appointments_insert" on public.appointments    for insert with check (true);
create policy "shop_inventory_all"  on public.shop_inventory  for all using (public.is_staff()) with check (public.is_staff());
