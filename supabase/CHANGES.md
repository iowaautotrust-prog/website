# Supabase Changes Log

## 2026-03-26

### Authentication
- Turned off email confirmation (Authentication → Providers → Email → "Confirm email" OFF)
- Site URL set to: `https://website-9t3.pages.dev`
- Redirect URLs: `https://website-9t3.pages.dev/**` and `http://localhost:5173/**`

### Profiles Table
- Created `public.profiles` table with columns: `id, name, phone, location, is_admin, is_manager, created_at`
- Note: does NOT have `email`, `full_name`, `avatar_url` columns (existing schema)
- Enabled Row Level Security (RLS)

### Profiles RLS Policies (final state)
- `profiles_select` — `for select using (true)` — anyone can read profiles
- `profiles_update` — `for update using (auth.uid() = id)` — users can only update own row

### Trigger
- Created `handle_new_user()` function + `on_auth_user_created` trigger on `auth.users`
- Inserts into profiles on every new signup: `id, name, is_admin`
- Sets `is_admin = true` automatically if email = `iowaautotrust@gmail.com`

### Settings Table
- Created `public.settings` table: `key (text PK), value (text), updated_at`
- Seeded default row: `('demo_mode', 'false')`
- RLS: anyone can read, admins can write
- Realtime enabled on `settings` table via Publications → supabase_realtime

### Other Tables Created (via schema.sql)
- `categories` — vehicle categories
- `vehicles` — car inventory
- `leads` — customer inquiries + test drive requests
- `transactions` — sales records
- `favorites` — user saved vehicles
- `vehicle_views` — recently viewed tracking
- `recent_searches` — user search history
- `coupons` — discount codes + `increment_coupon_uses()` function
- `shop_customers` — oil change shop customers
- `shop_vehicles` — customer vehicles for shop
- `service_jobs` — service job tracking (sequence: job_number_seq starting 1000)
- `service_items` — line items on jobs
- `shop_invoices` — invoices (sequence: invoice_number_seq starting 5000)
- `appointments` — service appointments
- `shop_inventory` — parts/supplies inventory

---

## 2026-03-27

### RLS Policy Overhaul (fix-policies.sql)
- Created `is_admin()` security definer function — checks `profiles.is_admin` bypassing RLS
- Created `is_staff()` security definer function — checks `is_admin OR is_manager` bypassing RLS
- Dropped ALL existing policies via dynamic SQL loop
- Recreated all policies using helper functions (no recursion possible)
- Fixed `transactions` policy — was referencing `user_id` column which doesn't exist (correct column is `buyer_id`)

### Final RLS Policy State
- `profiles`: select=true, insert=null (anyone), update=own row only
- `vehicles`: select=true (anyone), all=is_staff()
- `leads`: select=is_staff(), insert=null (anyone), update=is_staff()
- `favorites`: all=own row (auth.uid() = user_id)
- `categories`: select=true, all=is_admin()
- `transactions`: select=is_staff(), insert=null, update=is_staff()
- `settings`: select=true, all=is_admin()
- `appointments`: select=is_staff(), insert=null (anyone)
- `coupons`: select=active only, all=is_admin()
- `recent_searches`, `vehicle_views`: own row only
- `service_*`, `shop_*`: all=is_staff()
- Storage `objects` (vehicle-images): insert=anyone, select=anyone, update/delete=is_staff()

### Storage
- Storage policies on `objects` table fixed to use `is_staff()` instead of direct profiles query
- **TODO**: Create `vehicle-images` bucket as Public in Supabase → Storage

### Authentication URL Update
- Site URL updated to: `https://iowatrustmotors.netlify.app`
- Redirect URLs updated to: `https://iowatrustmotors.netlify.app/**`

---

## 2026-03-28

### Trigger Fix
- Fixed `handle_new_user()` trigger — was inserting non-existent columns (`email`, `full_name`, `avatar_url`)
- Correct version only inserts: `id, name, is_admin`
- Run this to apply:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
begin
  insert into public.profiles (id, name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.email = 'iowaautotrust@gmail.com'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Pending Supabase Actions
- [ ] Create `vehicle-images` storage bucket as **Public** in Supabase → Storage
- [ ] Verify `vehicle-images` storage policies allow public reads and staff writes
