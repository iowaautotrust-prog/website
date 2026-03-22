# Iowa Auto Trust — Email & Scheduled Reminders Setup

Everything here is configured **once** after your Vercel deployment is live.

---

## Step 1 — Create a Resend Account

1. Go to [resend.com](https://resend.com) → Sign up (free tier is fine to start)
2. After signing in, go to **Domains** → **Add Domain**
3. Enter `iowaautotrust.com`
4. Resend will give you DNS records (TXT + MX) — add these in your domain registrar (GoDaddy, Namecheap, etc.)
5. Click **Verify** — takes 5–30 minutes to propagate

> While waiting for domain verification, you can test with `onboarding@resend.dev` as the sender by temporarily editing the `FROM` variable in each function. Switch back to your domain before going live.

---

## Step 2 — Get Your Resend API Key

1. Resend → **API Keys** → **Create API Key**
2. Name it: `iowa-auto-trust-prod`
3. Permission: **Full access**
4. Copy the key — it starts with `re_`

---

## Step 3 — Install Supabase CLI & Link Project

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
```

> Find `YOUR-PROJECT-REF` in Supabase → Settings → General → Reference ID (looks like `abcdefghijklmnop`)

---

## Step 4 — Set the Resend Secret

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
```

Verify it was saved:
```bash
supabase secrets list
```

---

## Step 5 — Deploy All Edge Functions

Run these one by one:

```bash
supabase functions deploy send-lead-notification
supabase functions deploy send-welcome-email
supabase functions deploy send-appointment-confirmation
supabase functions deploy send-appointment-reminder
supabase functions deploy send-invoice-email
supabase functions deploy send-service-reminder
```

After each deploy you'll see a URL like:
```
https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-lead-notification
```

---

## Step 6 — Test Each Function

You can test directly with curl (replace values as needed):

**Test welcome email:**
```bash
curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","name":"Test User"}'
```

**Test lead notification:**
```bash
curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-lead-notification \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","leadType":"inquiry","vehicleName":"2022 Ford F-150"}'
```

> `YOUR-ANON-KEY` is in Supabase → Settings → API → anon public key

---

## Step 7 — Wire Welcome Email to Signup

The `send-welcome-email` function is called automatically from `src/pages/Signup.tsx` on successful signup. No extra config needed — it fires as soon as a user creates an account.

---

## Email Touchpoints Summary

| ID | Trigger | Function | Who receives |
|----|---------|----------|-------------|
| E1 | User signs up | `send-welcome-email` | New user |
| E2 | Appointment booked | `send-appointment-confirmation` | Customer / guest |
| E3 | 5 days before appointment | `send-appointment-reminder` | Customer / guest |
| E3b | 2 days before appointment | `send-appointment-reminder` | Customer / guest |
| E4 | Job marked completed | `send-invoice-email` | Customer |
| E5 | 5 days before next oil change | `send-service-reminder` | Customer |
| E5b | 2 days before next oil change | `send-service-reminder` | Customer |
| E7 | Contact form / vehicle inquiry | `send-lead-notification` | Admin (iowaautotrust@gmail.com) |

> E3, E3b, E5, E5b are triggered automatically by the pg_cron job (see below) — not manually.

---

---

# Scheduled Reminders — pg_cron Setup

E3, E3b, E5, and E5b are sent by a daily cron job that calls the reminder edge functions. Set this up once in Supabase.

---

## Step 1 — Enable pg_cron Extension

1. Supabase → **Database** → **Extensions**
2. Search for `pg_cron`
3. Toggle it **on**

---

## Step 2 — Enable pg_net Extension

The cron job uses `pg_net` to make HTTP calls to your edge functions.

1. Supabase → **Database** → **Extensions**
2. Search for `pg_net`
3. Toggle it **on**

---

## Step 3 — Schedule the Cron Jobs

Run this in **Supabase → SQL Editor** (replace both placeholder values):

```sql
-- Appointment reminders — runs daily at 8:00am Central (14:00 UTC)
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-appointment-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR-ANON-KEY'
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- Service / oil change reminders — runs daily at 8:05am Central (14:05 UTC)
SELECT cron.schedule(
  'send-service-reminders',
  '5 14 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-service-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR-ANON-KEY'
    ),
    body    := '{}'::jsonb
  )
  $$
);
```

> Replace:
> - `YOUR-PROJECT-REF` → Supabase → Settings → General → Reference ID
> - `YOUR-ANON-KEY` → Supabase → Settings → API → anon public key

---

## Step 4 — Verify the Jobs Are Scheduled

```sql
SELECT jobid, jobname, schedule, active FROM cron.job;
```

You should see both jobs listed as `active = true`.

---

## Step 5 — Test a Manual Run

Force an immediate run to confirm it works:

```sql
SELECT cron.run_job('send-appointment-reminders');
SELECT cron.run_job('send-service-reminders');
```

Check the results:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## Unschedule a Job (if needed)

```sql
SELECT cron.unschedule('send-appointment-reminders');
SELECT cron.unschedule('send-service-reminders');
```

---

## How the Reminder Logic Works

Each function queries for appointments/service reminders where:
- `next_service_date` (or `scheduled_at`) falls **exactly 5 days** or **exactly 2 days** from today
- `reminder_5d_sent = false` or `reminder_2d_sent = false`

After sending, it sets the flag to `true` so the same reminder is never sent twice — even if the cron runs again.
