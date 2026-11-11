-- Iowa Trust Motors - client website review (Nov 5, 2026)
-- Run ONCE in Supabase -> SQL Editor, BEFORE the website update goes live. Safe to run twice.
-- Nothing is deleted. It adds: the "Coming Soon" car status + optional price, lead spam status / notes /
-- delete / reply history, and closes two privacy holes in the users table (see section 3).

-- ─── 0. Helper functions (the same ones supabase/fix-policies.sql creates) ───────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin = true);
$$;

create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and (is_admin = true or is_manager = true));
$$;

-- ─── 1. Vehicles: "Coming Soon" status, and the price may be empty ───────────────────────────────────
-- Drops whichever CHECK on vehicles.status exists (its name differs between setups), then adds one that
-- allows all four statuses.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.vehicles'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ~ '^CHECK \(+status[ )]'
  loop
    execute format('alter table public.vehicles drop constraint %I', c.conname);
  end loop;
  alter table public.vehicles
    add constraint vehicles_status_check
    check (status in ('available', 'coming_soon', 'pending', 'sold'));
end $$;

-- A Coming Soon car may not have a price yet. The site stores "no price" as 0 and shows "Call for Price".
alter table public.vehicles alter column price drop not null;
alter table public.vehicles alter column price set default 0;

-- ─── 2. Leads: Spam status, internal notes, delete ───────────────────────────────────────────────────
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.leads'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ~ '^CHECK \(+status[ )]'
  loop
    execute format('alter table public.leads drop constraint %I', c.conname);
  end loop;
  alter table public.leads
    add constraint leads_status_check
    check (status in ('new', 'contacted', 'closed', 'spam'));
end $$;

alter table public.leads add column if not exists internal_notes text;

-- Only admins read, change or delete leads (anyone can still SUBMIT one from the website forms).
-- Every existing policy on leads is cleared first, because policies add up: one old, more generous policy
-- (for example "managers can read leads") would silently undo the rule.
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'leads' loop
    execute format('drop policy if exists %I on public.leads', r.policyname);
  end loop;
end $$;
alter table public.leads enable row level security;
create policy "leads_insert"       on public.leads for insert with check (true);
create policy "leads_admin_select" on public.leads for select using (public.is_admin());
create policy "leads_admin_update" on public.leads for update using (public.is_admin()) with check (public.is_admin());
create policy "leads_admin_delete" on public.leads for delete using (public.is_admin());

-- ─── 3. Lead reply history (emails sent from Admin -> Leads) ─────────────────────────────────────────
create table if not exists public.lead_replies (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  subject    text not null,
  body       text not null,
  sent_to    text not null,
  sent_by    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists lead_replies_lead_id_idx on public.lead_replies (lead_id, created_at);

alter table public.lead_replies enable row level security;
drop policy if exists "lead_replies_admin_select" on public.lead_replies;
create policy "lead_replies_admin_select" on public.lead_replies for select using (public.is_admin());
-- No insert/update/delete policy on purpose: replies are written only by the send-lead-reply function
-- (service role), so the history can only contain emails that were really sent.
grant select on public.lead_replies to authenticated;
grant all on public.lead_replies to service_role;

-- ─── 4. Users table (profiles): privacy + role protection ───────────────────────────────────────────
-- Found while checking Row Level Security: with the policies from fix-policies.sql, ANYONE (even a visitor
-- who is not signed in) could read every user's name, phone, location and admin/manager flags through
-- the public API, and any signed-in user could change their own is_admin flag. Both are closed here.
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;

alter table public.profiles enable row level security;

-- A user reads their own profile; admins read everybody's.
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
-- A user can create only their own, ordinary (non-admin) profile.
create policy "profiles_insert" on public.profiles for insert
  with check (auth.uid() = id and coalesce(is_admin, false) = false and coalesce(is_manager, false) = false);
-- A user edits their own profile; admins can edit any. Role flags are protected by the trigger below.
create policy "profiles_update" on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Only an admin may change is_admin / is_manager. Calls made with no signed-in user (the SQL editor and
-- the admin-users function, which runs with the service key) are allowed.
create or replace function public.protect_profile_roles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.is_admin is distinct from old.is_admin or new.is_manager is distinct from old.is_manager)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_roles on public.profiles;
create trigger protect_profile_roles
  before update on public.profiles
  for each row execute function public.protect_profile_roles();

-- ─── 5. New accounts can never become admin by themselves ───────────────────────────────────────────
-- The old signup trigger made whoever registered with the email iowaautotrust@gmail.com an admin. Email
-- confirmation is OFF on this project, so nobody has to prove they own an address: the moment that old
-- account is deleted, a stranger could register with it and become admin. Admin and manager roles are now
-- only ever given on purpose (Admin -> Users, or the SQL editor). Existing accounts are not touched.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
