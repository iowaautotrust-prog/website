-- Iowa Trust Motors - "when a car sells [and is later deleted], redirect instead of 404"
-- (Local SEO Plan, Nov 10 2026, section 3.4). Run once in Supabase -> SQL Editor. Safe to run twice.
--
-- A deleted vehicle's own row is gone, so there is nothing left to redirect its old URL to a
-- matching category page with -- unless we keep a tiny record of what it was, written at the
-- moment it's deleted. This table holds only that: no name, no photos, no VIN, just enough to
-- pick a sensible category page (see categoryRedirectPath in src/lib/vehicleSeo.ts).

create table if not exists public.deleted_vehicles (
  id           uuid primary key,
  type         text,
  title_status text,
  price        numeric,
  deleted_at   timestamptz not null default now()
);

alter table public.deleted_vehicles enable row level security;
drop policy if exists "deleted_vehicles_select" on public.deleted_vehicles;
create policy "deleted_vehicles_select" on public.deleted_vehicles for select using (true);
-- No insert/update/delete policy for anon/authenticated on purpose: only the trigger below
-- (security definer) ever writes a row.

create or replace function public.capture_deleted_vehicle()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.deleted_vehicles (id, type, title_status, price)
  values (old.id, old.type, old.title_status, old.price)
  on conflict (id) do nothing;
  return old;
end;
$$;

drop trigger if exists capture_deleted_vehicle on public.vehicles;
create trigger capture_deleted_vehicle
  after delete on public.vehicles
  for each row execute function public.capture_deleted_vehicle();
