# Iowa Auto Trust — Setup Guide

Complete instructions to get the platform live on Supabase + Vercel.

---

## Prerequisites

You will need accounts on:
- [Supabase](https://supabase.com) — database, auth, and image storage (free tier works)
- [Vercel](https://vercel.com) — hosting (free tier works)
- [Google Cloud Console](https://console.cloud.google.com) — for Google Sign-In (free)
- A GitHub account with this repo pushed to it

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New Project**
   - Name: `iowa-auto-trust`
   - Database password: create a strong one and save it
   - Region: **US East (N. Virginia)** — closest to Iowa
3. Wait ~2 minutes for it to initialize

---

## Step 2 — Get Your API Keys

1. In your Supabase project, go to **Settings → API**
2. Copy the following — you will need them later:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon / public key** → this is your `VITE_SUPABASE_ANON_KEY`

---

## Step 3 — Run the Database Schema

1. In Supabase → click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Paste the following SQL and click **Run**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  price NUMERIC NOT NULL,
  mileage INTEGER NOT NULL,
  year INTEGER NOT NULL,
  fuel TEXT NOT NULL,
  type TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  seats INTEGER,
  engine TEXT,
  transmission TEXT,
  description TEXT,
  features TEXT[],
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending')),
  in_carousel BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles (auto-created on signup)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  location TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicle Views (for analytics + recently viewed)
CREATE TABLE vehicle_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Favorites
CREATE TABLE favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, vehicle_id)
);

-- Leads / Inquiries
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_name TEXT,
  message TEXT,
  lead_type TEXT DEFAULT 'inquiry' CHECK (lead_type IN ('inquiry', 'contact', 'test_drive')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_name TEXT,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT,
  buyer_email TEXT,
  amount NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recent Searches
CREATE TABLE recent_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup (sets admin=true for iowaautotrust@gmail.com)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN NEW.email = 'iowaautotrust@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update vehicles.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Click **New Query** again, paste the following RLS policies, and click **Run**:

```sql
-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;

-- Vehicles: public can read available/pending; admin has full access
CREATE POLICY "Public reads available vehicles"
  ON vehicles FOR SELECT
  USING (status IN ('available', 'pending'));

CREATE POLICY "Admin full access on vehicles"
  ON vehicles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Categories: public read, admin write
CREATE POLICY "Public read categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Admin write categories"
  ON categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Profiles: users manage own; admin reads all
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin reads all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System inserts profiles"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vehicle views: anyone can insert; admin reads all
CREATE POLICY "Anyone can insert views"
  ON vehicle_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin reads all views"
  ON vehicle_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Favorites: user manages own
CREATE POLICY "User manages own favorites"
  ON favorites FOR ALL USING (auth.uid() = user_id);

-- Leads: anyone can insert; admin reads/updates all
CREATE POLICY "Anyone inserts leads"
  ON leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin reads all leads"
  ON leads FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admin updates leads"
  ON leads FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Transactions: user reads own; admin reads all; system inserts
CREATE POLICY "User reads own transactions"
  ON transactions FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Admin reads all transactions"
  ON transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "System inserts transactions"
  ON transactions FOR INSERT WITH CHECK (true);

-- Recent searches: user manages own
CREATE POLICY "User manages own searches"
  ON recent_searches FOR ALL USING (auth.uid() = user_id);
```

---

## Step 4 — Create the Image Storage Bucket

1. In Supabase → click **Storage** in the left sidebar
2. Click **New bucket**
   - Name: `vehicle-images`
   - Toggle **Public bucket** ON
   - Click **Create bucket**
3. Click on the bucket → click **Policies** tab
4. Click **New policy** → **For full customization**
5. Select operations: **INSERT**, **UPDATE**, **DELETE**
6. Policy name: `Admin can upload and manage images`
7. Policy expression:
   ```sql
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
   ```
8. Click **Review** → **Save policy**

---

## Step 5 — Create the Admin Account

1. In Supabase → click **Authentication** → **Users**
2. Click **Invite user**
3. Email: `iowaautotrust@gmail.com`
4. The signup trigger will automatically set `is_admin = true` for this email
5. An email invite link will be sent — use it to set a password

> **Note:** This is the only admin account. The admin panel at `/admin` is only accessible with this account.

---

## Step 6 — Set Up Google Sign-In

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project named `Iowa Auto Trust`
3. Navigate to **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Iowa Auto Trust`
   - Support email: `info@iowaautotrust.com`
   - Click through and **Save**
4. Navigate to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Iowa Auto Trust Web`
   - Authorized JavaScript origins: add your Vercel URL later (e.g. `https://iowa-auto-trust.vercel.app`)
   - Authorized redirect URIs: `https://YOUR-SUPABASE-PROJECT-REF.supabase.co/auth/v1/callback`
     *(Replace `YOUR-SUPABASE-PROJECT-REF` with the ref from your Supabase project URL)*
   - Click **Create**
5. Copy the **Client ID** and **Client Secret**
6. In Supabase → **Authentication → Providers → Google**
   - Toggle **Enable Google provider** ON
   - Paste the Client ID and Client Secret
   - Click **Save**

---

## Step 7 — Set Up Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **Add New Project** → import this GitHub repository
3. Framework preset: **Vite**
4. Under **Environment Variables**, add:
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase Project URL from Step 2 |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 2 |
5. Click **Deploy**
6. Once deployed, copy your live URL (e.g. `https://iowa-auto-trust.vercel.app`)

---

## Step 8 — Connect Vercel URL Back to Supabase

1. In Supabase → **Authentication → URL Configuration**
   - **Site URL**: `https://iowa-auto-trust.vercel.app`
   - **Redirect URLs**: add `https://iowa-auto-trust.vercel.app/auth/callback`
   - Click **Save**
2. Back in Google Cloud Console → your OAuth client → add to:
   - **Authorized JavaScript origins**: `https://iowa-auto-trust.vercel.app`
   - **Authorized redirect URIs**: keep the Supabase one from Step 6 (already there)
   - Click **Save**

---

## Step 9 — Local Development (Optional)

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Then run:

```bash
npm install
npm run dev
```

---

## Step 10 — First Steps After Going Live

1. **Log in** at `/login` with `iowaautotrust@gmail.com`
2. **Add vehicle categories** at `/admin/categories` (e.g. Sedans, SUVs, Trucks)
3. **Add your first vehicles** at `/admin/inventory`
   - Upload images directly from the admin panel
   - Toggle "Show in Carousel" for vehicles you want on the homepage hero
4. **Test the contact form** at `/contact` — check it shows up in `/admin/leads`
5. **Verify Google Sign-In** works from the login page

---

## Troubleshooting

**Google Sign-In not working?**
- Make sure the Supabase callback URL is added to Google Cloud Console authorized redirect URIs
- Make sure the Vercel URL is in authorized JavaScript origins

**Images not uploading?**
- Confirm the `vehicle-images` bucket is set to **Public**
- Confirm the storage policy allows admin inserts

**Admin page not accessible?**
- Confirm you signed in with `iowaautotrust@gmail.com`
- Check the `profiles` table in Supabase — the row for your user should have `is_admin = true`
- If not, run in SQL Editor: `UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';`

**Vehicles not showing on homepage?**
- Make sure vehicle status is `available` (not `pending`)
- For the hero carousel, make sure `in_carousel` is toggled on in admin

---

## Support

- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
