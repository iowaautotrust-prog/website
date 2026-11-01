-- Iowa Trust Motors – SEO change request (Oct 2026)
-- Additive and idempotent: safe to run more than once. Nothing is dropped.

-- ─── Vehicles: new spec fields ───────────────────────────────────────────────
alter table public.vehicles
  add column if not exists trim           text,
  add column if not exists drivetrain     text,
  add column if not exists stock_no       text,
  add column if not exists title_status   text,
  add column if not exists exterior_color text,
  add column if not exists interior_color text,
  add column if not exists carfax_url     text;

-- title_status is left NULL for existing cars on purpose: we don't claim "Clean"
-- for a car nobody has confirmed. Shown/exported only once it is filled in.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vehicles_title_status_check') then
    alter table public.vehicles
      add constraint vehicles_title_status_check
      check (title_status is null or title_status in ('Clean', 'Rebuilt'));
  end if;
end $$;

-- ─── Fuel wording: Petrol -> Gasoline (US term) ──────────────────────────────
update public.vehicles set fuel = 'Gasoline' where lower(fuel) = 'petrol';

-- ─── Leads: where did the buyer come from? ───────────────────────────────────
-- Older leads stay NULL (unknown) instead of being mislabelled "Direct".
alter table public.leads
  add column if not exists lead_source  text,
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_lead_source_check') then
    alter table public.leads
      add constraint leads_lead_source_check
      check (lead_source is null or lead_source in ('Google', 'Facebook', 'Direct', 'Other'));
  end if;
end $$;

-- ─── Homepage budget quiz options (editable in Admin) ────────────────────────
-- Stored as JSON in the existing settings table. RLS already allows public read
-- and admin write on that table.
insert into public.settings (key, value) values (
  'quiz_budget_options',
  '[{"label":"Under $10K","min":null,"max":10000},{"label":"$10K – $15K","min":10000,"max":15000},{"label":"$15K – $20K","min":15000,"max":20000},{"label":"$20K+","min":20000,"max":null}]'
) on conflict (key) do nothing;
