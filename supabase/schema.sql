-- ============================================================
-- Iowa Auto Trust — Full Database Schema
-- Run this in Supabase SQL Editor (in one go)
-- ============================================================

-- ─── PROFILES ────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  phone       text,
  is_admin    boolean not null default false,
  is_manager  boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile"  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email = 'iowaautotrust@gmail.com'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SETTINGS ────────────────────────────────────────────────
create table if not exists public.settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);
alter table public.settings enable row level security;
create policy "Anyone can read settings"    on public.settings for select using (true);
create policy "Admins can update settings"  on public.settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
-- Seed demo_mode default
insert into public.settings (key, value) values ('demo_mode', 'false') on conflict (key) do nothing;

-- ─── CATEGORIES ──────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Anyone can read categories" on public.categories for select using (true);
create policy "Admins can manage categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- ─── VEHICLES ────────────────────────────────────────────────
create table if not exists public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  make         text,
  model        text,
  year         int,
  price        numeric,
  mileage      int,
  fuel         text,
  transmission text,
  type         text,
  color        text,
  vin          text,
  description  text,
  image_url    text,
  images       text[],
  status       text not null default 'available', -- available | pending | sold
  view_count   int not null default 0,
  category_id  uuid references public.categories(id) on delete set null,
  features     text[],
  created_at   timestamptz not null default now()
);
alter table public.vehicles enable row level security;
create policy "Anyone can read available vehicles" on public.vehicles for select using (true);
create policy "Admins can manage vehicles" on public.vehicles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);

-- ─── LEADS ───────────────────────────────────────────────────
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  name         text not null,
  email        text not null,
  phone        text,
  vehicle_id   uuid references public.vehicles(id) on delete set null,
  vehicle_name text,
  message      text,
  lead_type    text not null default 'inquiry', -- inquiry | test_drive | finance
  status       text not null default 'new',     -- new | contacted | closed
  created_at   timestamptz not null default now()
);
alter table public.leads enable row level security;
create policy "Anyone can insert leads" on public.leads for insert with check (true);
create policy "Admins can read all leads" on public.leads for select using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);
create policy "Admins can update leads" on public.leads for update using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);

-- ─── TRANSACTIONS ─────────────────────────────────────────────
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  vehicle_id   uuid references public.vehicles(id) on delete set null,
  vehicle_name text,
  buyer_name   text,
  buyer_email  text,
  amount       numeric,
  status       text not null default 'pending', -- pending | completed | cancelled
  created_at   timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "Admins can manage transactions" on public.transactions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);

-- ─── FAVORITES ───────────────────────────────────────────────
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, vehicle_id)
);
alter table public.favorites enable row level security;
create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id);

-- ─── VEHICLE VIEWS ───────────────────────────────────────────
create table if not exists public.vehicle_views (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  viewed_at  timestamptz not null default now()
);
alter table public.vehicle_views enable row level security;
create policy "Users manage own views" on public.vehicle_views for all using (auth.uid() = user_id);

-- ─── RECENT SEARCHES ─────────────────────────────────────────
create table if not exists public.recent_searches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  query      text not null,
  created_at timestamptz not null default now()
);
alter table public.recent_searches enable row level security;
create policy "Users manage own searches" on public.recent_searches for all using (auth.uid() = user_id);

-- ─── COUPONS ─────────────────────────────────────────────────
create table if not exists public.coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  description    text,
  discount_type  text not null default 'percent', -- percent | fixed
  discount_value numeric not null,
  max_uses       int,
  used_count     int not null default 0,
  active         boolean not null default true,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);
alter table public.coupons enable row level security;
create policy "Anyone can read active coupons" on public.coupons for select using (active = true);
create policy "Admins can manage coupons" on public.coupons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create or replace function public.increment_coupon_uses(coupon_code text)
returns void language plpgsql security definer as $$
begin
  update public.coupons set used_count = used_count + 1 where code = coupon_code;
end;
$$;

-- ─── SHOP: CUSTOMERS ─────────────────────────────────────────
create table if not exists public.shop_customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  address    text,
  notes      text,
  created_at timestamptz not null default now()
);
alter table public.shop_customers enable row level security;
create policy "Admins manage shop customers" on public.shop_customers for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);

-- ─── SHOP: CUSTOMER VEHICLES ─────────────────────────────────
create table if not exists public.shop_vehicles (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.shop_customers(id) on delete cascade,
  make        text not null,
  model       text not null,
  year        int,
  plate       text,
  vin         text,
  color       text,
  mileage     int,
  created_at  timestamptz not null default now()
);
alter table public.shop_vehicles enable row level security;
create policy "Admins manage shop vehicles" on public.shop_vehicles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);

-- ─── SHOP: SERVICE JOBS ──────────────────────────────────────
create sequence if not exists public.job_number_seq start 1000;
create table if not exists public.service_jobs (
  id           uuid primary key default gen_random_uuid(),
  job_number   text not null unique default 'JOB-' || nextval('job_number_seq'),
  customer_id  uuid references public.shop_customers(id) on delete set null,
  vehicle_id   uuid references public.shop_vehicles(id) on delete set null,
  status       text not null default 'pending', -- pending | in_progress | completed | cancelled
  notes        text,
  total        numeric not null default 0,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.service_jobs enable row level security;
create policy "Admins manage service jobs" on public.service_jobs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);
-- Public job tracking by job_number
create policy "Anyone can read job by number" on public.service_jobs for select using (true);

-- ─── SHOP: SERVICE ITEMS (LINE ITEMS) ────────────────────────
create table if not exists public.service_items (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.service_jobs(id) on delete cascade,
  service_type text not null, -- oil_change | tire_rotation | brake_service | custom
  description  text,
  quantity     int not null default 1,
  unit_price   numeric not null default 0,
  total        numeric generated always as (quantity * unit_price) stored,
  created_at   timestamptz not null default now()
);
alter table public.service_items enable row level security;
create policy "Admins manage service items" on public.service_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);
create policy "Anyone can read service items" on public.service_items for select using (true);

-- ─── SHOP: INVOICES ──────────────────────────────────────────
create sequence if not exists public.invoice_number_seq start 5000;
create table if not exists public.shop_invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default 'INV-' || nextval('invoice_number_seq'),
  job_id         uuid references public.service_jobs(id) on delete set null,
  customer_id    uuid references public.shop_customers(id) on delete set null,
  total          numeric not null default 0,
  paid           boolean not null default false,
  paid_at        timestamptz,
  notes          text,
  created_at     timestamptz not null default now()
);
alter table public.shop_invoices enable row level security;
create policy "Admins manage invoices" on public.shop_invoices for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);
create policy "Anyone can read invoice by id" on public.shop_invoices for select using (true);

-- ─── SHOP: APPOINTMENTS ──────────────────────────────────────
create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references public.shop_customers(id) on delete set null,
  vehicle_id   uuid references public.shop_vehicles(id) on delete set null,
  service_type text,
  scheduled_at timestamptz not null,
  status       text not null default 'scheduled', -- scheduled | confirmed | in_progress | completed | cancelled
  notes        text,
  created_at   timestamptz not null default now()
);
alter table public.appointments enable row level security;
create policy "Admins manage appointments" on public.appointments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);
create policy "Anyone can insert appointment" on public.appointments for insert with check (true);

-- ─── SHOP: PARTS INVENTORY ───────────────────────────────────
create table if not exists public.shop_inventory (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sku        text unique,
  category   text,
  quantity   int not null default 0,
  unit       text default 'each',
  cost       numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shop_inventory enable row level security;
create policy "Admins manage shop inventory" on public.shop_inventory for all using (
  exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true))
);

-- ─── REALTIME ────────────────────────────────────────────────
-- Enable Realtime on settings table so demo mode toggle propagates instantly
-- (Do this in Supabase Dashboard > Database > Replication > enable for settings table)
