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
