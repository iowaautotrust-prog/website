# Iowa Trust Motors Website — GoDaddy DNS Setup

## What to Do

Point your domain `iowatrustmotors.com` to the new website hosting.

---

## Steps

1. Log into **godaddy.com** → **My Products → Domains → iowatrustmotors.com → Manage DNS**

2. Delete any existing **A** and **CNAME** records

3. Add a new **A record**:
   - Type: `A`
   - Name: (leave blank)
   - Value: `75.2.60.5`
   - Click **Save**

4. Add a new **CNAME record**:
   - Type: `CNAME`
   - Name: `www`
   - Value: `iowaautotrust.netlify.app`
   - Click **Save**

5. Wait 10 minutes to a few hours for the changes to take effect

6. Visit `iowatrustmotors.com` in your browser — site should load

Done! 🎉
