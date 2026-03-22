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

5. **Email Notifications (optional — for enquiry alerts)**
   - Create a free account at [resend.com](https://resend.com)
   - Create an API key
   - Install Supabase CLI: `npm install -g supabase`
   - Login: `supabase login`
   - Link your project: `supabase link --project-ref YOUR-PROJECT-REF`
   - Set your key: `supabase secrets set RESEND_API_KEY=re_your_key_here`
   - Deploy: `supabase functions deploy send-lead-notification`
   - Once deployed, every new enquiry from a customer will send an email to `iowaautotrust@gmail.com`
