# Pointing your GoDaddy domain at the Vercel site

**Goal:** make your live domain (currently serving a GoDaddy-hosted site) serve this
Next.js app deployed on Vercel — *without* transferring the domain and without
breaking email.

**Strategy:** keep the domain **registered and DNS-managed at GoDaddy**, and just
repoint two records (`A` + `CNAME`) at Vercel. This is the safest, fully reversible
path. You are **not** changing nameservers and **not** transferring the domain.

> Replace `yourdomain.com` below with your real domain everywhere it appears.

---

## Before you start — 2-minute pre-flight

1. **Log in to GoDaddy** and find the domain under **My Products → Domains**.
2. **Log in to Vercel** and open the project for this app.
3. **Email safety check (do this first):**
   - GoDaddy → your domain → **DNS → Manage DNS**.
   - Look down the records list for any rows of **Type = `MX`**.
   - **If you see MX rows:** you have email on this domain. That's fine — this guide
     never touches MX, so email keeps working. Just **do not delete the MX rows.**
   - **If there are no MX rows:** no email is configured; nothing to worry about.
4. **(Recommended) Lower the TTL a few hours ahead.** On the existing `A` record for
   `@`, set **TTL = 600 seconds** (GoDaddy calls it "1/2 Hour" or "Custom"). Save.
   Waiting a few hours after this lets the old long TTL expire so the final cutover
   propagates fast. Optional but it makes the switch feel near-instant.

---

## Step 1 — Add the domain in Vercel (do this BEFORE editing GoDaddy)

1. Vercel → your project → **Settings → Domains**.
2. In **Add Domain**, enter `yourdomain.com` → **Add**.
3. Add the `www` variant too: enter `www.yourdomain.com` → **Add**.
4. Vercel now shows the DNS records it expects, and the domains sit in a
   **"Invalid Configuration" / pending** state until DNS points at it. That's normal —
   you fix it in Step 2.

> **Use the exact values Vercel shows you.** The values below are the current Vercel
> standard, but if Vercel displays something different, Vercel wins.

---

## Step 2 — Edit the two DNS records in GoDaddy

GoDaddy → your domain → **DNS → Manage DNS**.

### 2a. Apex record (`yourdomain.com` with no www)

- Find the existing record **Type `A`, Name `@`** (it currently points at GoDaddy
  hosting — some IP like `xxx.xxx.xxx.xxx`, or it may be a "Parked" record).
- **Edit** it and set the value to Vercel's IP:

  | Type | Name | Value         | TTL  |
  |------|------|---------------|------|
  | `A`  | `@`  | `76.76.21.21` | 600  |

- If GoDaddy refuses to edit it (e.g. it's a forwarding/parked entry), **delete** the
  old `@` A record and **Add** a new one with the values above.

### 2b. www record

- Find or add the record **Type `CNAME`, Name `www`**:

  | Type    | Name  | Value                  | TTL  |
  |---------|-------|------------------------|------|
  | `CNAME` | `www` | `cname.vercel-dns.com` | 600  |

- If a `www` `A` record already exists, replace it with this CNAME.

### 2c. Kill any GoDaddy forwarding (most common gotcha)

- GoDaddy → domain → **Domain Settings → Forwarding** (sometimes under "Additional
  Settings"). If **Domain Forwarding** or **Subdomain Forwarding** is ON, **turn it
  off / delete it.**
- A leftover forwarding rule silently overrides your `A` record and keeps showing the
  old site — this is the #1 reason "I changed DNS but it still shows GoDaddy."

### Leave everything else alone

- **Do not touch `MX` records** (email).
- **Do not change nameservers.**
- **Do not delete `TXT` records** (SPF/DKIM/domain verification) unless you know what
  they are.

---

## Step 3 — Set the primary domain in Vercel

1. Back in Vercel → **Settings → Domains**.
2. Decide which is canonical: **`yourdomain.com`** (apex) or **`www.yourdomain.com`**.
   Most people pick the bare `yourdomain.com`.
3. Set that one as **Primary**; Vercel auto-creates a redirect from the other so both
   work and resolve to one canonical URL.
4. Vercel **auto-provisions the HTTPS/SSL certificate** once DNS resolves — usually a
   few minutes, no action needed. The pending domains flip to a green
   **"Valid Configuration"**.

---

## Step 4 — Update the app's site URL and redeploy

The app reads `NEXT_PUBLIC_SITE_URL` to build links in order-confirmation and contact
emails. It falls back to `http://localhost:3000` if unset, so this must be set in prod.

1. Vercel → **Settings → Environment Variables**.
2. Set (or update) for the **Production** environment:

   ```
   NEXT_PUBLIC_SITE_URL = https://yourdomain.com
   ```
   (Use the same canonical domain you chose in Step 3.)
3. **Redeploy** the Production deployment (Deployments → ⋯ → Redeploy) so the new value
   is baked in.

---

## Step 5 — Verify

From your terminal:

```bash
dig yourdomain.com +short
# expect: 76.76.21.21

dig www.yourdomain.com +short
# expect: it resolves through cname.vercel-dns.com to a Vercel IP
```

Then:

- Open **https://yourdomain.com** in an **incognito/private window** (avoids cached
  old-site results).
- Confirm the padlock (valid SSL) and that the Vercel site loads.
- Place a test order / submit the contact form and confirm the email link points at
  `https://yourdomain.com`, not localhost.

**Propagation note:** for a short window (minutes up to a couple hours, depending on
the old TTL) some visitors may still see the old GoDaddy site while caches expire.
This is normal and clears on its own. Lowering TTL ahead of time (pre-flight step 4)
minimizes it.

---

## Rollback (if something looks wrong)

Fully reversible — you only changed two records:

1. GoDaddy → **DNS → Manage DNS**.
2. Set the `A` `@` record back to the **original GoDaddy IP** (and restore the old
   `www` record if you changed it).
3. Re-enable forwarding if you had it.
4. Within the TTL window, the old GoDaddy site is back.

> Tip: before editing in Step 2, screenshot or copy the original `A`/`CNAME` values so
> you have the exact rollback target.

---

## Quick reference

| Item                     | Value                                   |
|--------------------------|-----------------------------------------|
| Apex `A` record (`@`)    | `76.76.21.21`                           |
| `www` `CNAME`            | `cname.vercel-dns.com`                  |
| TTL (during cutover)     | `600` seconds                           |
| Env var to set in Vercel | `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` |
| Do **not** change        | `MX` (email), nameservers, SPF/DKIM `TXT` |
| Common gotcha            | GoDaddy domain **forwarding** still on  |
