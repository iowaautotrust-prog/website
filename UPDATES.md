# Iowa Auto Trust — Database Updates

Run these in your Supabase **SQL Editor** — these are additions on top of the original schema you already ran.

---

## Update 1 — New Vehicle Columns

Adds VIN number and sale/discount fields to your existing `vehicles` table.

```sql
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS vin TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS discount_label TEXT,
  ADD COLUMN IF NOT EXISTS discount_expires TIMESTAMPTZ;
```

---

## Update 2 — Coupons Table

Creates the coupon / discount code system used on the Admin → Discounts page.

```sql
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_price NUMERIC,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can read active coupons (needed to validate codes on vehicle pages)
CREATE POLICY "Public reads active coupons"
  ON coupons FOR SELECT
  USING (active = true);

-- Only admin can create, update, and delete coupons
CREATE POLICY "Admin full access on coupons"
  ON coupons FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
```

---

## Update 3 — Manager Role

Adds the Manager role. Managers can access Inventory, Leads, and Transactions — but not Users, Categories, Import, Discounts, or system settings.

```sql
-- Add manager column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT false;

-- Managers can read all vehicles (including non-available ones, for the admin inventory panel)
CREATE POLICY "Manager reads all vehicles"
  ON vehicles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_manager = true));

-- Managers can update vehicles (edit inventory)
CREATE POLICY "Manager updates vehicles"
  ON vehicles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_manager = true));

-- Managers can insert vehicles
CREATE POLICY "Manager inserts vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_manager = true));

-- Managers can delete vehicles
CREATE POLICY "Manager deletes vehicles"
  ON vehicles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_manager = true));

-- Managers can read all leads
CREATE POLICY "Manager reads all leads"
  ON leads FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_manager = true));

-- Managers can update lead status
CREATE POLICY "Manager updates leads"
  ON leads FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_manager = true));

-- Managers can read all transactions
CREATE POLICY "Manager reads all transactions"
  ON transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_manager = true));

-- Managers can read all profiles (needed for admin pages that join profile data)
CREATE POLICY "Manager reads all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_manager = true));
```

---

## What Each Role Can Access

| Page | Admin | Manager | User |
|------|-------|---------|------|
| `/admin` Dashboard | Full analytics + toggles | Limited view (leads + nav) | ✗ |
| `/admin/inventory` | Full CRUD | Full CRUD | ✗ |
| `/admin/leads` | Yes | Yes | ✗ |
| `/admin/transactions` | Yes | Yes | ✗ |
| `/admin/users` | Yes (assign roles) | ✗ | ✗ |
| `/admin/categories` | Yes | ✗ | ✗ |
| `/admin/import` | Yes | ✗ | ✗ |
| `/admin/discounts` | Yes | ✗ | ✗ |

To assign the Manager role: go to `/admin/users` → find the user → click **"Make Manager"**.

---

## Update 4 — Global Settings + Oil Change / Shop System

Run this **after** Updates 1–3. This adds the global settings table (for demo mode) and the full oil change shop management system.

```sql
-- ─── Global Settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed demo mode as off by default
INSERT INTO settings (key, value) VALUES ('demo_mode', 'false')
  ON CONFLICT (key) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed to check demo mode without auth)
CREATE POLICY "Public reads settings"
  ON settings FOR SELECT USING (true);

-- Only admin can change settings
CREATE POLICY "Admin updates settings"
  ON settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));


-- ─── Shop Customers ───────────────────────────────────────────────────────────
CREATE TABLE shop_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  -- Link to auth user if they have an account
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and manager full access on shop_customers"
  ON shop_customers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)
  ));

-- Users can read their own linked customer record
CREATE POLICY "User reads own shop_customer"
  ON shop_customers FOR SELECT
  USING (auth.uid() = user_id);


-- ─── Shop Vehicles ────────────────────────────────────────────────────────────
CREATE TABLE shop_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES shop_customers(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  plate TEXT,
  vin TEXT,
  color TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and manager full access on shop_vehicles"
  ON shop_vehicles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)
  ));

CREATE POLICY "User reads own shop_vehicles"
  ON shop_vehicles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shop_customers
    WHERE shop_customers.id = shop_vehicles.customer_id
    AND shop_customers.user_id = auth.uid()
  ));


-- ─── Service Jobs (Work Orders) ───────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS service_job_seq START 1;

CREATE TABLE service_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT UNIQUE NOT NULL DEFAULT ('JOB-' || LPAD(nextval('service_job_seq')::TEXT, 4, '0')),
  customer_id UUID REFERENCES shop_customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES shop_vehicles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_tech TEXT,
  notes TEXT,
  mileage_in INTEGER,
  mileage_out INTEGER,
  next_service_date DATE,
  next_service_mileage INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_service_jobs_updated_at
  BEFORE UPDATE ON service_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE service_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and manager full access on service_jobs"
  ON service_jobs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)
  ));

-- Public can read job by job_number (for tracking page — no auth required)
CREATE POLICY "Anyone can read service_jobs for tracking"
  ON service_jobs FOR SELECT
  USING (true);


-- ─── Service Items (Line Items per Job) ───────────────────────────────────────
CREATE TABLE service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES service_jobs(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  oil_type TEXT,
  quantity NUMERIC,
  unit TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and manager full access on service_items"
  ON service_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)
  ));

CREATE POLICY "Anyone can read service_items"
  ON service_items FOR SELECT USING (true);


-- ─── Shop Invoices ────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS shop_invoice_seq START 1;

CREATE TABLE shop_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL DEFAULT ('INV-' || LPAD(nextval('shop_invoice_seq')::TEXT, 4, '0')),
  job_id UUID REFERENCES service_jobs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES shop_customers(id) ON DELETE SET NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and manager full access on shop_invoices"
  ON shop_invoices FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)
  ));

-- Users can read their own invoices (linked via customer user_id)
CREATE POLICY "User reads own invoices"
  ON shop_invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shop_customers
    WHERE shop_customers.id = shop_invoices.customer_id
    AND shop_customers.user_id = auth.uid()
  ));

-- Anyone can read by invoice/job reference (for tracking page)
CREATE POLICY "Anyone reads invoices for job tracking"
  ON shop_invoices FOR SELECT USING (true);


-- ─── Appointments ─────────────────────────────────────────────────────────────
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES shop_customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES shop_vehicles(id) ON DELETE SET NULL,
  -- For guest bookings (no account)
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  -- Link to auth user if logged in
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  reminder_5d_sent BOOLEAN DEFAULT false,
  reminder_2d_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and manager full access on appointments"
  ON appointments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)
  ));

-- Anyone can insert (guest booking)
CREATE POLICY "Anyone can book appointment"
  ON appointments FOR INSERT WITH CHECK (true);

-- Users read own appointments
CREATE POLICY "User reads own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);


-- ─── Service Reminders (Next Oil Change Tracking) ─────────────────────────────
CREATE TABLE service_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES shop_customers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES shop_vehicles(id) ON DELETE CASCADE,
  last_service_date DATE,
  last_mileage INTEGER,
  next_service_date DATE,
  next_service_mileage INTEGER,
  reminder_5d_sent BOOLEAN DEFAULT false,
  reminder_2d_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE service_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and manager full access on service_reminders"
  ON service_reminders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)
  ));


-- ─── Shop Inventory ───────────────────────────────────────────────────────────
CREATE TABLE shop_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('oil', 'filter', 'parts', 'supplies', 'other')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  min_quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and manager full access on shop_inventory"
  ON shop_inventory FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)
  ));
```

---

## What Each Role Can Access (Updated)

| Page | Admin | Manager | User |
|------|-------|---------|------|
| `/admin` Dashboard | Full analytics + toggles | Limited (leads + nav) | ✗ |
| `/admin/inventory` | Full CRUD | Full CRUD | ✗ |
| `/admin/leads` | Yes | Yes | ✗ |
| `/admin/transactions` | Yes | Yes | ✗ |
| `/admin/users` | Yes | ✗ | ✗ |
| `/admin/categories` | Yes | ✗ | ✗ |
| `/admin/import` | Yes | ✗ | ✗ |
| `/admin/discounts` | Yes | ✗ | ✗ |
| `/shop` (default landing) | Yes | Yes — default home | ✗ |
| `/shop/customers` | Yes | Yes | ✗ |
| `/shop/jobs` | Yes | Yes | ✗ |
| `/shop/appointments` | Yes | Yes | ✗ |
| `/shop/invoices` | Yes | Yes | ✗ |
| `/shop/reports` | Yes | Yes | ✗ |
| `/service` (book appointment) | — | — | Public |
| `/service/track/:jobNumber` | — | — | Public |
| Profile → Invoices tab | — | — | Own only |

---

## What You Still Need to Do (Deployment)

1. **Run Updates 1–3 above** in Supabase → SQL Editor

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) → Add New Project → import your GitHub repo
   - Framework: **Vite**
   - Add environment variables:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click **Deploy**
   - Copy your Vercel URL (e.g. `https://iowa-auto-trust.vercel.app`)

3. **Connect Vercel URL to Supabase Auth**
   - Supabase → Authentication → URL Configuration
   - Site URL: `https://iowa-auto-trust.vercel.app`
   - Redirect URLs: add `https://iowa-auto-trust.vercel.app/auth/callback`
   - Save

4. **Connect Vercel URL to Google OAuth**
   - Go to Google Cloud Console → your OAuth client
   - Add to **Authorized JavaScript origins**: `https://iowa-auto-trust.vercel.app`
   - Save

5. **Run Update 4 SQL** in Supabase → SQL Editor (settings + full shop system tables)

6. **Email Setup (configure together at the end)**
   - Create a free account at [resend.com](https://resend.com)
   - Create an API key
   - Install Supabase CLI: `npm install -g supabase`
   - Login: `supabase login`
   - Link your project: `supabase link --project-ref YOUR-PROJECT-REF`
   - Set your Resend key: `supabase secrets set RESEND_API_KEY=re_your_key_here`
   - Deploy all edge functions:
     ```bash
     supabase functions deploy send-lead-notification
     supabase functions deploy send-welcome-email
     supabase functions deploy send-appointment-confirmation
     supabase functions deploy send-appointment-reminder
     supabase functions deploy send-invoice-email
     supabase functions deploy send-service-reminder
     ```
   - Email functions handle:
     - **E1** Welcome email on signup
     - **E2** Appointment booking confirmation
     - **E3/E3b** Appointment reminders at T-5 and T-2 days
     - **E4** Job completed — invoice + next service suggestion
     - **E5/E5b** Next oil change reminders at T-5 and T-2 days
     - **E7** New enquiry alert to admin (already deployed)
