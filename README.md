# Ginger Cuisine — Pickup Ordering Site

Modern, mobile-first website for a family Vietnamese restaurant.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · MongoDB (via Prisma) · Resend (email) · Upstash Redis (rate limiting)

> Built for real-world use in a family-owned restaurant.

---

## What the site does

**Customer site** (`/`, `/menu`, `/order`, `/location`, `/about`, `/contact`):

- Browse menu, add items to cart (with sizes, flavors, add-ons). **Optional per-line notes** are on each item card on **`/menu`** and in **Popular dishes on `/order`** **before** Add to cart (e.g. *no cilantro*); you can still tweak notes in checkout (**CartSummary**) or split lines with **Add another with different notes**. Lines with identical choices **merge qty** unless the line already has notes — **add the same dish with different modifiers** via a second cart line.
- **Rice plates** and four specialty plates (Chicken & Shrimp Pad Thai; Chicken & Beef Teriyaki Udon; Lemongrass Tofu with Pad Thai; Curry Tofu with Brown Rice) include a mutually-exclusive **Base** as the **Size** row: White Rice, Brown Rice, Mixed Vegetables, Pad Thai, Udon, Vermicelli, or Fried Rice (**+$1**).
- Fill pickup details (**phone** validated/formatted via `libphonenumber-js` with default region `NEXT_PUBLIC_PHONE_DEFAULT_REGION`, default `CA`; stored as **E.164** in MongoDB).
- Place a **pay-in-person** order. The order page only accepts submissions **inside the restaurant's published hours** and while staff have not manually paused ordering; outside that window a banner with today's hours and a collapsible weekly schedule is shown and the submit button is disabled. The window is enforced server-side in `/api/order` (503 + reason) so the client can never bypass it.
- Receive an order confirmation URL (`/order/confirmation?orderId=&token=`). The **confirmation page doubles as live order tracking**: a **3-step timeline** (**Placed → Acknowledged → Ready**) and **`OrderStatusTracker` polls `/api/order/status` every ~10s** while the tab is visible (free, serverless-safe, no SMS/email to customers). Staff-internal “completed” stays off the tracker; customers see **“Order ready for pickup”** instead of a picked-up step.

> Payment is **always collected in person** at the restaurant at pickup. There is no online payment step.

**`/order`** also shows **Your recent orders on this device**: after checkout, `{ orderId, token }` pairs are remembered in **`localStorage` (`gc_recent_orders`)** for up to 24 hours/capped at five entries — no account login. Same links work as tracking URLs.

**`/about`** includes an embedded **Vimeo** video (`components/about/VideoEmbed.tsx`): a poster + facade so the Vimeo player only loads after the block scrolls into view (**muted autoplay**) or after the visitor taps play (earlier gesture). Customize the Vimeo ID and poster image in `app/(site)/about/page.tsx`.

**Menu & Order Pickup pages are mobile-first:** every menu item and every "Popular dishes" entry on `/order` shows a real photo (via `next/image`). On phones the photo is full-width with a 4:3 aspect ratio so dishes are easy to recognize and tap; on tablet/desktop it collapses to a compact left-side thumbnail. Image paths live in `MENU_IMAGES` in `data/menu.ts`.

**Restaurant dashboard** (`/dashboard`):

- Staff tablet view of all incoming online orders.
- Real-time-ish updates via polling (default 4s).
- Pop-up toast for brand-new orders (since dashboard mount) plus a **repeating audio chime every ~3s** while **any** order is still in **New** (stops when the last one is acknowledged/cancelled); browsers may require a tap/keypress first to unlock sound (banner shown when needed).
- Kanban columns: **New → Acknowledged → Ready → Completed**, plus **Cancelled**.
- Each order card shows customer, pickup time, full item list, totals, payment status, and elapsed time.
- Staff can acknowledge, mark ready, complete, or cancel orders. They still enter the order into the existing POS by hand — there is no in-app POS toggle.
- **Pause / resume incoming online orders** from the top bar. Pausing opens a short modal where staff can optionally type a customer-facing reason (e.g. *"Kitchen catching up — back in 20 min"*); resuming is a single tap. A full-width amber banner spans the top of the dashboard while ordering is paused or outside hours, and the change propagates to customer-facing pages and other tablets within ~30s.

---

## Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and fill in values
npx prisma generate
npm run dev
```

Open <http://localhost:3000> for the customer site and <http://localhost:3000/dashboard> for the staff dashboard.

### Required environment variables

| Var                                        | What it does                                                     |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                     | Base URL for the site.                                           |
| `RESTAURANT_NAME` / `RESTAURANT_ADDRESS` / `RESTAURANT_PHONE` | Branding. |
| `RESTAURANT_HOURS` (optional)              | Free-form marketing hours string shown in the footer / location page. **When unset, derived automatically from `HOURS_SCHEDULE`** so the displayed hours and the order-gate cannot drift apart. Override to add holiday notes. |
| `HOURS_TIMEZONE` (optional)                | IANA timezone the schedule is interpreted in (default `America/Toronto`). |
| `HOURS_SCHEDULE` (optional)                | Weekly schedule, Monday→Sunday, comma-separated; each entry is `HH:MM-HH:MM` (24h) or `closed`. Default: `11:00-23:00` every day. The order page banner, the submit button, and `POST /api/order` all use this. |
| `LAST_ORDER_LEAD_MIN` (optional)           | Stop accepting new online orders this many minutes **before** close (default `15`) so the kitchen can finish the last tickets. Set `0` for a literal cutoff at close. |
| `NEXT_PUBLIC_RESTAURANT_PHONE`             | Phone number shown publicly.                                     |
| `NEXT_PUBLIC_PHONE_DEFAULT_REGION` (optional)| Default ISO country code for parsing typed phone numbers (e.g. `CA`). See `PHONE_DEFAULT_REGION` in `lib/config.ts`. |
| `TAX_RATE`                                 | Tax multiplier (e.g. `0.13` for 13% HST).                        |
| `RESEND_API_KEY` / `RESEND_DOMAIN` / `RESEND_FROM_EMAIL` | Resend email config.                                |
| `RESTAURANT_ORDER_EMAIL`                   | Who receives new order notifications.                            |
| `RESTAURANT_CONTACT_EMAIL` / `NEXT_PUBLIC_RESTAURANT_CONTACT_EMAIL` | Contact form inbox.                      |
| `DATABASE_URL`                             | MongoDB connection string.                                       |
| `CRON_SECRET`                              | Secret for the weekly Vercel Cron that pings Mongo **and** Upstash Redis (see below). `openssl rand -hex 32`. **Required in production** so the Atlas M0 and Upstash free tiers do not auto-pause/archive for inactivity. |
| `DASHBOARD_PASSWORD`                       | Shared staff password for `/dashboard`. Rotate regularly.        |
| `DASHBOARD_SESSION_SECRET`                 | 32+ char random string for signing the dashboard session cookie. Generate with `openssl rand -hex 32`. |
| `DASHBOARD_POLL_INTERVAL_MS` (optional)    | Poll interval ms for the dashboard (default 4000).               |
| `DASHBOARD_HISTORY_WINDOW_HOURS` (optional)| How many hours of completed/cancelled history show on the board (default 72). Older orders are reachable via the search bar. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate-limiting backend. Optional for local dev, **required for production**. |

---

## Ordering & data flow

0. Before checkout even renders the submit button, `/order` calls **`GET /api/order/availability`** (also polled every 30s + on focus) to learn whether ordering is currently accepting. When it isn't, the page shows a banner with today's hours / pause reason and disables the submit button.
1. Customer places order on `/order` → client POSTs a list of **selection references** (`menuItemId`, `quantity`, `selectedSizeId`, `selectedAddonIds`, `selectedFlavorId`, `notes`) to `POST /api/order`. **Prices and names are not sent from the client** — they are recomputed on the server.
2. `POST /api/order` runs the ordering-window gate first (`lib/orderingStatus.ts` — staff pause + hours, restaurant TZ, last-order lead minutes). Closed/paused windows short-circuit with **`503`** and a customer-facing reason. If we're accepting, it validates with Zod, calls `priceCart()`… It then assigns a **`orderCode`** of **six Crockford-base32 chars** (~32⁶ combos, easy to give over the phone — e.g. `K7XD9A`) with three collision retries on Mongo unique-key races, plus a **`viewToken` (128-bit hex)** that **actually protects confidentiality** against guessing strangers' orders).
3. Restaurant receives a Resend email with the full order (no Stripe references).
4. Customer is redirected to `/order/confirmation?orderId=…&token=…`. Detailed line items render only when **`token`** matches the stored **`viewToken`** (constant-time compare). The same page shows **`PICKUP_READY_NOTICE`**, a **live status timeline**, and a client **poll of `GET /api/order/status` every ~10s** (while the tab is visible) — no SMS/email/Push to customers.
5. **`localStorage` key `gc_recent_orders`** (max 5 listings, 24h retention) remembers recent `{ orderId, token }` pairs on the **`/order`** page so customers can reopen their tracking link without an account.
6. Staff tablet on `/dashboard` polls `/api/dashboard/orders` every 4s. A short chime **repeats while any order stays `new`**, with a one-time toast per brand-new arrival; staff acknowledge, punch the POS, advance **Acknowledged → Ready → Completed** (or cancel).

---

## Security model

| Threat                         | Mitigation                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| Unauthorized dashboard access  | `DASHBOARD_PASSWORD` + HMAC-SHA256 signed, HttpOnly, SameSite=Lax session cookie (12h). |
| Brute-force dashboard login    | Upstash rate limit: **5 attempts / min / IP** on `/api/dashboard/login`. |
| Flood of junk customer orders  | Upstash rate limit: **10 orders / min / IP** on `/api/order`. |
| Contact-form spam              | Upstash rate limit: **5 submissions / 10 min / IP** on `/api/contact`. |
| Runaway dashboard API calls    | Upstash rate limit: **60 writes / min / session** on `/api/dashboard/orders/:id` and on `/api/dashboard/orders/pause` (staff pause toggle — auth + same-origin + same per-session bucket). |
| Hijacked dashboard session scraping orders | Upstash rate limit: **120 reads / min / session** on `GET /api/dashboard/orders` and `GET /api/dashboard/orders/:id` via the shared `dashboardRateLimitKey` (cookie-hash key, not IP). |
| Brute-force passcode via timing | `verifyDashboardPassword` sha256-hashes both sides to fixed-length digests before constant-time compare, so password length is not observable via response timing. |
| SMTP header / subject injection via contact + order emails | `sanitizeOneLine` / `sanitizeMultiLine` strip CR/LF from every user-supplied string before it reaches the Resend payload. |
| Storefront silently accepts orders during DB outage | `/api/order/availability` fail-closed: catch-block returns `accepting: false` with `degraded: true`. |
| Spamming public order status   | Upstash rate limit: **60 reads / min / IP** on `/api/order/status` (`orderId` + `viewToken` query still required — wrong pair → 404). |
| Client-forged prices           | Server recomputes every line from `data/menu.ts`; unknown items / sizes / add-ons / flavors are rejected with a 400. |
| Oversized carts / inputs       | Zod caps: 50 cart lines, 25 qty/line, 20 add-ons/line, 80-char name, 30-char phone, 120-char email, 200-char password, 300-char notes. |
| CSRF                           | Every state-changing endpoint requires `Origin` or `Referer` to match the request `Host`. |
| Confirmation-page URL leaking other customers' orders | Per-order `viewToken` required and constant-time compared. |
| Clickjacking / MIME-sniff / referer leaks | Default headers on every route: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`. `poweredByHeader: false`. |
| Dashboard indexed by search engines | `/dashboard` and `/api/dashboard` get `X-Robots-Tag: noindex, nofollow, noarchive` + `no-store`. |
| Dashboard timing attacks       | `timingSafeEqual` on both password check and session signature verify. |

> **Rate limiting fails closed in production.** If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are missing in `NODE_ENV=production`, every rate-limited endpoint returns `429 Too Many Requests` — a misconfigured deploy is loudly broken rather than silently unprotected. In dev (`NODE_ENV !== "production"`) limiters still no-op with the same one-time boot warning.

---

## Scalability & the 72-hour window

The live `/dashboard` is designed to stay fast and cheap indefinitely:

- **Default view** = every active order (regardless of age) **plus** every completed/cancelled order from the last `DASHBOARD_HISTORY_WINDOW_HOURS` hours (default **72**, i.e. last three days). A stale "acknowledged" order from 3 weeks ago still appears; a completed order from 3 weeks ago does not.
- **Older orders** are reachable via the **search box** (name, phone, or order #). Search hits the database directly through `/api/dashboard/orders/search`, returns up to 50 matches, bypasses the time window, pauses polling, and swaps the kanban for a flat results view.
- **Hard server cap** on every list fetch is 500 orders. Even on an unusually busy day with the window bumped to 7 days, the board won't try to render unbounded data.
- **Rate limits** (in addition to the customer-side ones):
  - Dashboard writes: 60 / min / session
  - Dashboard search: 30 / min / session

### What this means for free-tier hosting

Assumptions: 1 tablet, 50 orders/day, 12-hour open time, 4-second poll.

| Resource | Per-day cost | Free-tier limit | Headroom |
|---|---|---|---|
| Vercel serverless invocations (poll + patch + search) | ~11,000 | 1M edge requests/mo, 100 GB-hr compute/mo | plenty |
| Vercel bandwidth (at ~20 active orders × ~1KB/order + deltas) | ~200–400 MB | 100 GB/mo | plenty |
| MongoDB Atlas storage | ~2 MB (50 orders × ~40 KB) | 512 MB (M0 free) | years of orders |
| Upstash commands (rate-limit writes + contact + login + search) | ~500 | 10,000/day | plenty |

You stay inside free-tier limits easily for a single restaurant. For **multiple restaurants** on the same free tiers, the bottleneck is Vercel bandwidth: each additional always-open tablet adds another ~10 GB/month. At 5–8 tablets you should upgrade Vercel to Pro ($20/mo, 1 TB) or raise the poll interval (e.g. `DASHBOARD_POLL_INTERVAL_MS=8000`).

### Scaling knobs

- `DASHBOARD_POLL_INTERVAL_MS` — seconds between polls. Raising from 4s → 8s halves bandwidth and CPU.
- `DASHBOARD_HISTORY_WINDOW_HOURS` — how much history the board shows. Smaller = smaller payloads = faster tablets.
- `schema.prisma` indexes — composite `(orderStatus, createdAt desc)` index is in place, so the board's main query is O(log n) even with tens of thousands of historical orders.
- **If you ever pass ~50k orders** and search starts to feel slow, flip search to [MongoDB Atlas Search](https://www.mongodb.com/docs/atlas/atlas-search/) (free tier includes 5 search indexes). Nothing about the app's API would change — only the implementation inside `searchOrders()`.
- **If you have 10+ restaurants / 10+ tablets**, consider switching polling to Server-Sent Events on a long-running process, or Pusher/Ably. But polling remains correct behavior for a single restaurant indefinitely.

### Things to be aware of

- **Search is case-insensitive regex** on MongoDB; it scans rather than uses a B-tree index when you use middle-of-string terms. Fine up to ~50k orders. Partial phone matches also try a digits-only comparison so `"4161234567"` matches stored `"(416) 123-4567"`.
- **Active orders never age out of the board**, even if they're older than the window. If you leave an order in "acknowledged" indefinitely, it stays visible — which is usually what you want.
- **The client doesn't delete orders**. Staff can only move them to `cancelled` or `completed`. If you ever want to purge very old orders, do it from the Atlas console or add a scheduled job.
- **Polling pauses during search.** When the search box has 2+ characters, the board stops auto-refreshing; clear the search to resume live updates.

---

## Real-time choice

The dashboard uses **polling** (default 4s) rather than WebSockets/SSE/Pusher/Ably. Rationale:

- Works with Vercel / Netlify / any serverless deployment (no long-lived connections needed).
- No extra dependency, no extra service account, nothing to break.
- MongoDB change streams need a long-lived Node process with replica-set access — heavier than you need.
- 4s is more than fine for a tablet at a host stand; it only takes a poll cycle or two to appear.

Duplicate notifications are avoided by the board tracking two client-side `Set<orderId>` refs: orders it has ever seen (to only fire a toast for genuinely new orders after mount) and orders it has already notified for. Audio is separate: a **Web Audio** loop (`useNewOrderAlarm`) plays while `orderStatus === "new"` for any order until staff clear the **New** column.

---

## Directory map

```
instrumentation.ts           Production boot diagnostics (NODE_ENV): logs missing DATABASE_URL / dashboard /
                             Upstash env / warns on missing cron or Resend (see repo file)

app/
  layout.tsx                 minimal root layout
  (site)/                    customer-facing site group
    layout.tsx               MainNav, Footer, CartProvider, FloatingCart, sticky button
    page.tsx                 home
    menu/ order/ location/ about/ contact/
  dashboard/                 internal staff dashboard
    layout.tsx
    page.tsx                 kanban board
    login/page.tsx + LoginForm.tsx
  api/
    order/route.ts                POST new pay-in-person order (server-priced, hours/pause-gated, rate-limited)
    order/status/route.ts         GET minimal order status for tracking (token + rate limit)
    order/availability/route.ts   GET public ordering availability (hours + pause snapshot)
    contact/route.ts              POST contact form (rate-limited)
    cron/heartbeat/route.ts       GET weekly Mongo + Redis ping (Vercel Cron + CRON_SECRET)
    dashboard/
      login/route.ts              POST password → signed cookie (rate-limited)
      logout/route.ts
      orders/route.ts             GET recent-and-active orders (windowHours, limit, session-authed)
      orders/[orderId]/route.ts   GET + PATCH status (rate-limited)
      orders/search/route.ts      GET older orders by name/phone/# (rate-limited)
      orders/pause/route.ts       GET availability + POST toggle to pause/resume online ordering

components/
  cart/ (context, floating cart)
  layout/ (nav, footer, sticky button)
  order/ (cart summary, pickup form, confirmation tracking, recent orders, OrderingAvailabilityBanner, useOrderingAvailability)
  about/VideoEmbed.tsx           Vimeo embed facade (scroll-to-play muted / tap-to-play) for `/about`
  dashboard/ (OrderBoard, OrderCard, OrderDetailsDrawer, NewOrderToast, useNewOrderAlarm, StatusBadge, ElapsedTime, DashboardTopBar, PauseOrdersControl + OrderingStatusBanner)
  ui/

lib/
  config.ts                  env-backed config (tax, polling, etc.; RESTAURANT_HOURS now defaults to formatted summary of hours.ts)
  types.ts                   shared TS types
  validation.ts              Zod schemas (with max caps; includes orderingPauseUpdateSchema)
  pricing.ts                 trusted server-side cart pricing
  prisma.ts                  Prisma client
  orderStore.ts              createOrder / getOrderById / listOrders / updateOrder
  orderCode.ts               Crockford 6-char codes + normalisation
  recentOrders.ts            localStorage helpers (`gc_recent_orders`)
  timingSafeString.ts        timing-safe string compare (shared with API routes)
  email.ts                   Resend helpers (order + contact)
  dashboardAuth.ts           HMAC session cookie helpers + constant-time password compare
  requireDashboardSession.ts auth guards for server components + API routes
  requireSameOrigin.ts       CSRF / same-origin helper for state-changing endpoints
  rateLimit.ts               Upstash Ratelimit wrapper (graceful no-op if unconfigured)
  hours.ts                   structured weekly schedule + "are we open now?" in restaurant TZ
  restaurantSettings.ts      JSON key/value store for restaurant-wide toggles (e.g. orderingPause)
  orderingStatus.ts          composes hours + staff pause into one OrderingAvailability snapshot
  utils.ts                   cn(), formatCurrency()

prisma/
  schema.prisma              Order model (includes viewToken) + RestaurantSetting key/value model

data/
  menu.ts                    menu data — the source of truth for item prices
```

---

## Deploying (Vercel)

1. Push repo to GitHub.
2. Create a Vercel project from the repo.
3. **Create an Upstash Redis database** at <https://console.upstash.com/>:
   - New Database → Regional → pick the region nearest your Vercel region.
   - Open it → **REST API** tab → copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
4. Set **all** env vars from `.env.example` in **Vercel → Project → Settings → Environment Variables**, for both Production and Preview.
5. Deploy.

### Keeping the free MongoDB and Upstash tiers alive

Both free tiers go dormant when idle: MongoDB Atlas **M0 (free) clusters** can auto-pause after about **30 days of no connections**, and the **Upstash Redis free tier** archives databases that receive no traffic for a few weeks. This app includes a [Vercel Cron](https://vercel.com/docs/cron-jobs) that runs every **Monday at 12:00 UTC** and calls `GET /api/cron/heartbeat`, which `ping`s **both** the database (via Prisma) and the Upstash Redis rate-limit instance. That keeps minimal traffic on each even when the site is quiet (pre-launch, closed for vacation, etc.).

- The Mongo ping is authoritative: if it fails the route returns **500**. The Redis ping is best-effort — the request itself is the keepalive traffic, so a transient Redis error is reported in the JSON response but never fails the heartbeat. If Upstash env vars are absent the Redis result is `{ ok: false, skipped: true }`.
- Add **`CRON_SECRET`** in Vercel (Production) — a long random string; generate with `openssl rand -hex 32`. Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>` to cron invocations.
- The route returns **401** without a valid Bearer token (browsers cannot hit it by accident).
- After deploy, open **Vercel → your project → Settings → Cron Jobs** and confirm `/api/cron/heartbeat` is listed; you can use **Run** to test without waiting for Monday.
- The schedule is in [`vercel.json`](vercel.json): `0 12 * * 1` (Mondays, UTC; e.g. 8:00 AM EDT in summer).

After deploying, smoke-test:

```bash
# /dashboard/login should 429 after 5 failed tries in a minute
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://YOUR-DOMAIN/api/dashboard/login \
    -H "Content-Type: application/json" \
    -H "Origin: https://YOUR-DOMAIN" \
    -d '{"password":"wrong"}'
done
# Expected: 401 401 401 401 401 429
```

The dashboard is at `/dashboard`; it is protected by `DASHBOARD_PASSWORD` and a signed HttpOnly cookie (12h sessions), `noindex`’d, and rate-limited at the API layer.
