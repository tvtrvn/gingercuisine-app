# Ginger Cuisine — Pickup Ordering Site

Modern, mobile-first website for a family Vietnamese restaurant — online pickup ordering
plus a staff tablet dashboard. Built for real-world use.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · MongoDB (via Prisma) · Resend (email) · Upstash Redis (rate limiting)

> Payment is **always collected in person** at pickup. There is no online payment step.

---

## What it does

**Customer site** (`/`, `/menu`, `/order`, `/location`, `/about`, `/contact`)
- Browse the menu, customize items (sizes, flavors, add-ons, per-line notes), build a cart.
- Place a **pay-in-person** pickup order — accepted only inside published hours and while staff
  haven't paused ordering (enforced server-side in `/api/order`).
- Get a confirmation URL that doubles as **live order tracking** (Placed → Acknowledged → Ready),
  with no account, SMS, or email required.

**Staff dashboard** (`/dashboard`, password-protected)
- Tablet kanban of incoming orders: **New → Acknowledged → Ready → Completed** (+ Cancelled).
- New-order toast + repeating audio chime while any order is still New.
- **Pause / resume** online ordering with an optional customer-facing reason.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in values
npx prisma generate
npm run dev
```

- Customer site → <http://localhost:3000>
- Staff dashboard → <http://localhost:3000/dashboard>

**Environment variables:** `.env.example` is the authoritative list (every var, with inline notes).
See **`walkthrough.md` §5** for what each one does.

---

## Deploy (Vercel)

1. Push to GitHub, create a Vercel project from the repo.
2. Create an **Upstash Redis** database and copy its REST URL + token.
3. Set **all** vars from `.env.example` in Vercel → Settings → Environment Variables (Production + Preview).
4. Deploy. Confirm the weekly heartbeat cron (`/api/cron/heartbeat`, schedule in `vercel.json`) is listed —
   it keeps the free MongoDB Atlas / Upstash tiers from auto-pausing.

Full deploy walkthrough (MongoDB Atlas, Resend, Upstash, cron, smoke tests): **`walkthrough.md` §6**.

---

## Documentation

| Doc | Covers |
|-----|--------|
| **`walkthrough.md`** | The canonical deep-dive — architecture, every `lib/` file, **security model (§9)**, **end-to-end data flow (§10)**, database schema, common tasks, troubleshooting. |
| `docs/blob-setup.md` | Image hosting via Vercel Blob. |
| `docs/e2e-testing.md` | Playwright E2E suite. |
| `docs/archive/` | Historical reference: product PRD, one-time domain-cutover runbook. |

**Security & scale in one line:** server recomputes all prices, per-order view tokens gate
confirmation pages, Upstash rate-limits every endpoint (fails closed in production), and the dashboard
stays bounded by a rolling history window. Details and the full threat table live in `walkthrough.md` §9–§10.
