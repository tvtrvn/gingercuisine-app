# Ginger Cuisine — Complete Codebase Walkthrough

A comprehensive guide for engineers (and the restaurant's future maintainer) who want to understand every part of this application: what it does, how it works, where each piece lives, and what every term means.

---

## 1. Introduction

This is **the live pickup-ordering platform for Ginger Cuisine** — a family Vietnamese restaurant in Toronto. The app is in production at <https://gingercuisine.app>, handling real customers and real (cash) money. Two surfaces share the same Next.js codebase:

1. **Customer storefront** — `/`, `/menu`, `/about`, `/location`, `/contact`, `/order`, `/order/confirmation`. Customers browse the menu, build a cart, fill in pickup details, and submit a **pay-in-person** order. The server emails the customer a confirmation, generates a 6-character order code, and returns a confirmation page with a tokenized URL.

2. **Staff tablet dashboard** — `/dashboard` (password-protected). Front-of-house staff watch incoming orders on a wall-mounted iPad: a sound alarm fires on each new order, cards animate in newest-first, status moves through `new → acknowledged → ready → completed` with one tap. A "Pause online ordering" toggle stops the storefront from accepting orders during a rush. Search lets staff look up older orders by name, phone, or code.

The system is intentionally **payment-free in the app layer**. The earlier (v1) build used Stripe — that was deliberately ripped out (~600 lines deleted, zero downtime) because the restaurant accepts cash + debit machine at pickup. The lesson encoded here: the simplest implementation that fits the actual business beats one that adds an extra failure mode.

Defensive features that make this *production*:

- **HMAC-SHA256 signed `HttpOnly` session cookies** with constant-time signature verification.
- **Per-order 128-bit `viewToken`** so customers can't enumerate other people's orders by guessing the 6-char code.
- **Upstash Redis sliding-window rate limits** on 7 buckets (login, order create, order status poll, contact, dashboard writes, dashboard searches, dashboard reads). In production, a missing Upstash config now hard-refuses requests rather than silently disabling protection.
- **CSRF via same-origin check** on every mutating POST.
- **Server-side cart re-pricing** — the client's `price` / `unitPrice` fields are *ignored*; menu data is the source of truth.
- **Hardened HTTP headers** declared in `next.config.ts` / `vercel.json` (HSTS preload, X-Frame-Options DENY, nosniff, Permissions-Policy).
- **Weekly heartbeat cron** that pings MongoDB and Upstash Redis so neither free tier auto-pauses/archives from inactivity.

---

## 2. High-Level Architecture

```
+--------------------+        +--------------------+
|  Customer phone /  |        |   Staff iPad        |
|   laptop browser   |        |   (kiosk-ish)       |
+----------+---------+        +----------+---------+
           |                              |
           | https / same-origin POSTs    | password login → HttpOnly cookie
           v                              v
+----------------------------------------------------+
|         Next.js 16 (App Router) on Vercel          |
|                                                    |
|  (site)/        — customer pages                   |
|  /dashboard     — staff pages (server-side gated)  |
|  /api/order     — POST: create order (pay-in-person)
|  /api/order/status              — GET: poll status |
|  /api/order/availability        — GET: open/closed |
|  /api/dashboard/orders          — GET/PATCH        |
|  /api/dashboard/orders/[id]     — PATCH/DELETE     |
|  /api/dashboard/orders/search   — GET              |
|  /api/dashboard/orders/pause    — POST             |
|  /api/dashboard/login           — POST             |
|  /api/dashboard/logout          — POST             |
|  /api/contact                   — POST             |
|  /api/cron/heartbeat            — GET (Bearer)     |
+----------+--------------------------------+--------+
           |                                |
           v                                v
+-------------------------+      +---------------------+
|  Prisma ORM (Mongo)     |      | Upstash Redis        |
|  MongoDB Atlas (M0)     |      | (sliding-window     |
|  Orders, RestaurantSetting|     |  rate limits)       |
+-------------------------+      +---------------------+
           +
+-------------------------+
|  Resend (email)         |
+-------------------------+
```

**Customer order flow:**

1. Browser loads `/menu` → reads `data/menu.ts` (static).
2. `CartProvider` (React Context) holds the cart in memory; `FloatingCart` shows the running total.
3. On `/order`, `PickupForm` collects name/phone/email/pickup time.
4. Submit → `POST /api/order` with selections only (no prices).
5. Server: same-origin check → rate-limit (10/min/IP) → availability gate (hours + staff pause) → `priceCart()` recomputes from `menu.ts` → `createOrder()` writes to Mongo with a fresh `orderCode` + `viewToken` → `sendOrderEmail()` fires async.
6. 201 → `/order/confirmation?id=...&t=<viewToken>` page polls `/api/order/status` for live status updates.

**Staff dashboard flow:**

1. `/dashboard/login` → `POST /api/dashboard/login` with password.
2. Server validates with `timingSafeEqual`, sets `gc_dashboard_session=<HMAC-signed token>` cookie (HttpOnly, Secure, SameSite=Lax, 12h TTL).
3. `/dashboard` server-renders the initial order list (active + recent 24h).
4. `OrderBoard` client component polls `GET /api/dashboard/orders` every 6 seconds.
5. New order detected → `useNewOrderAlarm` plays a chime, `NewOrderToast` slides in.
6. Tap a card → status PATCH; the audit timestamp (`acknowledgedAt`, `readyAt`, …) is set server-side.

---

## 3. Tech Stack at a Glance

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Pages, layouts, route handlers, RSC |
| Language | **TypeScript 5** | Type safety, especially on Zod-validated API edges |
| UI library | **React 19** | Components, hooks |
| Styling | **Tailwind CSS 4** | Utility classes via PostCSS |
| Icons | **lucide-react** | SVG icons |
| ORM | **Prisma 6** (MongoDB driver) | Type-safe DB access |
| Database | **MongoDB Atlas (M0 free)** | Documents for orders + settings |
| Email | **Resend** | Transactional confirmation emails |
| Rate limiting | **@upstash/ratelimit + @upstash/redis** | Sliding-window in Redis |
| Validation | **Zod 3** | Request body validation |
| Phone parsing | **libphonenumber-js** | Server-side phone normalization |
| Hosting | **Vercel** | Edge + Node runtimes, cron, env vars |
| Lint | **ESLint 9** + `eslint-config-next` | Code style |

**Three reasons the stack is what it is:**

1. **Next.js App Router** — server components avoid a separate API backend and let me gate `/dashboard` server-side without flashing un-auth'd content.
2. **MongoDB + Prisma** — orders are document-shaped (cart JSON varies per order) and the data volume is tiny. The M0 free tier is plenty; Prisma still gives me a typed client and migrations.
3. **Resend** — drop-in transactional email with React Email templates, no SMTP config.

---

## 4. Project Layout

```
gingercuisine-app/
├── PRD.md                                 # Full product spec
├── RESUME.md                              # Engineering highlights for résumé
├── README.md
├── package.json
├── next.config.ts / next.config.mjs       # Headers, image domains
├── vercel.json                            # Cron + extra header policies
├── instrumentation.ts                     # Startup logs (warns if rate-limit unconfigured)
├── prisma/
│   └── schema.prisma                      # Order + RestaurantSetting models
├── prisma.config.ts
├── data/
│   └── menu.ts                            # ALL menu items (truth source for pricing)
├── lib/                                   # Pure logic + adapters
│   ├── prisma.ts                          # Prisma client singleton
│   ├── types.ts                           # Shared types: Order, CartItem, etc.
│   ├── config.ts                          # Constants: TAX_RATE, poll intervals, etc.
│   ├── pricing.ts                         # priceCart() — server re-pricing
│   ├── orderCode.ts                       # 6-char Crockford base32 generator
│   ├── orderStore.ts                      # createOrder, listRecentAndActive, mutations
│   ├── orderingStatus.ts                  # Hours + staff-pause gate
│   ├── restaurantSettings.ts              # KV store for runtime flags
│   ├── hours.ts                           # Toronto-local business hours
│   ├── email.ts                           # Resend wrapper + template
│   ├── rateLimit.ts                       # Upstash limiters (login/order/contact/dashboard)
│   ├── dashboardAuth.ts                   # HMAC token issue + verify + password check
│   ├── requireDashboardSession.ts         # Server helper to gate routes
│   ├── requireSameOrigin.ts               # CSRF same-origin check
│   ├── timingSafeString.ts                # Constant-time string compare
│   ├── validation.ts                      # Zod schemas for every request body
│   ├── recentOrders.ts                    # Lookup helpers
│   ├── useMediaQuery.ts                   # Client hook
│   └── utils.ts                           # cn(), classnames helper
├── app/
│   ├── layout.tsx                         # Root html/body + fonts + CartProvider
│   ├── (site)/                            # Customer surface (group folder — no URL segment)
│   │   ├── layout.tsx                     # MainNav + Footer + StickyOrderButton
│   │   ├── page.tsx                       # Landing
│   │   ├── menu/page.tsx                  # Menu browse
│   │   ├── about/page.tsx                 # About + VideoEmbed
│   │   ├── location/page.tsx              # Address, hours, map
│   │   ├── contact/page.tsx               # Contact form
│   │   ├── order/page.tsx                 # Checkout
│   │   └── order/confirmation/page.tsx    # Tokenized confirmation
│   ├── dashboard/                         # Staff surface
│   │   ├── layout.tsx                     # DashboardTopBar
│   │   ├── login/page.tsx                 # Server page
│   │   ├── login/LoginForm.tsx            # Client form
│   │   └── page.tsx                       # Server-renders board with initial orders
│   └── api/
│       ├── order/route.ts                 # POST: create
│       ├── order/availability/route.ts    # GET: open/closed
│       ├── order/status/route.ts          # GET: poll a single order (token-gated)
│       ├── contact/route.ts               # POST: contact form
│       ├── cron/heartbeat/route.ts        # GET (Bearer): Mongo + Redis ping
│       └── dashboard/
│           ├── login/route.ts             # POST: password → cookie
│           ├── logout/route.ts            # POST
│           ├── orders/route.ts            # GET: list active + recent
│           ├── orders/[orderId]/route.ts  # PATCH: status / note
│           ├── orders/search/route.ts     # GET: search by name/phone/code
│           └── orders/pause/route.ts      # POST: toggle accepting flag
└── components/
    ├── layout/                            # MainNav, Footer, StickyOrderButton
    ├── ui/                                # Button, Card, Input, Skeleton, …
    ├── about/VideoEmbed.tsx
    ├── cart/
    │   ├── cart-context.tsx               # CartProvider + useCart()
    │   └── FloatingCart.tsx               # Bottom-sheet cart on mobile
    ├── order/
    │   ├── PickupForm.tsx                 # Checkout form
    │   ├── CartSummary.tsx
    │   ├── CopyOrderIdButton.tsx
    │   ├── OrderStatusTracker.tsx         # Polls /api/order/status
    │   ├── OrderingAvailabilityBanner.tsx # "We're closed" banner
    │   ├── RecentOrdersList.tsx           # localStorage-backed
    │   └── useOrderingAvailability.ts
    └── dashboard/
        ├── OrderBoard.tsx                 # The big polling client (572 lines)
        ├── OrderCard.tsx                  # Per-order card with state machine
        ├── OrderDetailsDrawer.tsx
        ├── StatusBadge.tsx
        ├── ElapsedTime.tsx
        ├── DashboardTopBar.tsx
        ├── PauseOrdersControl.tsx
        ├── NewOrderToast.tsx
        └── useNewOrderAlarm.ts            # Plays chime on new order
```

---

## 5. How to Run Locally

### Prerequisites

- **Node 18+** and **npm**.
- A **MongoDB Atlas** free cluster (M0) — or a local MongoDB if you prefer.
- (Optional, but recommended) An **Upstash** Redis database for rate limiting. Without it, rate limiting is a no-op in dev and `instrumentation.ts` logs a warning.
- (Optional) A **Resend** account + API key for transactional email; without it, the order POST still succeeds but no email goes out.

### Step 1: Install + generate

```bash
cd GingerApps/gingercuisine-app
npm install        # postinstall runs `prisma generate`
```

### Step 2: Configure `.env.local`

```bash
# Database
DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# Dashboard auth
DASHBOARD_PASSWORD=<staff-shared-password>
DASHBOARD_SESSION_SECRET=<random-32-byte-hex>   # 16+ chars required

# Rate limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Ginger Cuisine <orders@gingercuisine.app>
RESEND_REPLY_TO=hello@gingercuisine.app

# Cron secret (only needed in production)
CRON_SECRET=<random-32-byte-hex>
```

`DASHBOARD_SESSION_SECRET` must be 16+ chars; the dashboard auth module throws at boot otherwise. This is a deliberate fail-fast.

### Step 3: Run

```bash
npm run dev           # next dev at http://localhost:3000
```

The customer site is at `/`, the staff dashboard at `/dashboard` (login first at `/dashboard/login`).

### Step 4: Production build (test locally before deploy)

```bash
npm run build         # prisma generate && next build
npm start             # next start
```

---

## 6. How to Deploy

### Vercel

1. Push the repo to GitHub.
2. Vercel → **Add New Project** → import repo. Root directory is the project folder.
3. Set every env var from `.env.local` in **Project Settings → Environment Variables** (Production + Preview).
4. Deploy.

### Vercel Cron (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/heartbeat", "schedule": "0 9 * * 1" }
  ]
}
```

Every Monday, Vercel hits `/api/cron/heartbeat` with `Authorization: Bearer <CRON_SECRET>`. The route runs a trivial Mongo `ping` (so Atlas M0 doesn't auto-pause after 30 days idle) and a Redis `ping` (so the Upstash free tier isn't archived after a few weeks idle). The token check uses `timingSafeEqual` so an attacker can't brute-force it via timing.

### MongoDB Atlas

- Free M0 cluster, single region close to Vercel's primary region.
- Network access: allow `0.0.0.0/0` (Vercel uses many IPs); the SRV connection string already requires authentication.
- The Prisma schema's `@@index([orderStatus, createdAt(sort: Desc)])` composite index is the workhorse for the dashboard query "active orders + recent history."

### Resend

- Verify the sending domain (DKIM, SPF, DMARC) — the `gingercuisine.app` SPF/DMARC records were already in place when this was wired up.
- Sandbox first: send to one whitelist email, then flip to verified-domain mode once DKIM passes.

### Upstash

- Free Redis Global, paste URL + token into Vercel env.
- The `instrumentation.ts` boot log flags it loud if missing in production.

---

## 7. Code Deep-Dive

### 7.1 `app/layout.tsx` — root document

The root layout sets the `<html lang="en">` shell, loads the two fonts (system serif + a display variable), wraps everything in `<CartProvider>` (so any page can use the cart), and adds the favicon + metadata. Tailwind v4 is wired via `app/globals.css` (a single `@import "tailwindcss"`).

### 7.2 `app/(site)/` — customer-facing pages

`(site)` is a **route group** — the parens hide the segment from the URL. The shared `(site)/layout.tsx` mounts `<MainNav>`, `<Footer>`, and `<StickyOrderButton>` so every customer page has the same navigation. The dashboard is *outside* this group so it has its own chrome (no nav, no footer).

Pages:

- `/` — Landing with hero, signature dishes, hours.
- `/menu` — Browse by category. Hydrated with `data/menu.ts`; client-side filtering.
- `/about` — Family story + a `VideoEmbed`.
- `/location` — Address, hours, embedded map.
- `/contact` — `POST /api/contact` form.
- `/order` — `<PickupForm>` + `<CartSummary>`. Submits to `/api/order`.
- `/order/confirmation?id=<orderCode>&t=<viewToken>` — `<OrderStatusTracker>` polls `/api/order/status?id=...&t=...` every few seconds.

### 7.3 `app/dashboard/*` — staff surface

- `dashboard/login/page.tsx` — Server page (no flash of logged-in content for logged-out users).
- `dashboard/login/LoginForm.tsx` — Client form; `POST /api/dashboard/login` with `{ password }`.
- `dashboard/page.tsx` — Server component. Checks the session cookie via `hasDashboardSession()`; redirects to `/dashboard/login` if invalid. Then runs **two parallel reads** (the slowest page in the app, so parallelism matters):
  - `listRecentAndActive({ windowHours: 24, limit: 500 })` — orders for the board.
  - `getOrderingAvailability()` — open/paused state.
- `dashboard/layout.tsx` — `<DashboardTopBar>` (restaurant name, online/paused chip, logout).

### 7.4 `app/api/order/route.ts` — the most defensive POST

Walk through what a single order POST does in order:

1. **Same-origin check** (`isSameOrigin(req)`). Rejects any POST whose `Origin` doesn't match the deployed domain. CSRF defense, since `HttpOnly` cookies still travel cross-origin if the path is open.
2. **Rate limit** by IP — 10 orders/minute. `429 + Retry-After` on hit.
3. **Availability gate** — both **business hours** (`hours.ts` uses Toronto local time, handles DST and holidays) **and** the **staff pause flag** (`RestaurantSetting` doc). Both checks happen *before* JSON parsing so closed-time POSTs are cheap.
4. **Zod validation** of the body via `orderRequestSchema` — strict shape: `items[].menuItemId`, `quantity`, optional `notes/selectedSizeId/selectedAddonIds/selectedFlavorId`, plus `pickupDetails`. Note what's **absent**: no `price`, no `unitPrice`, no `total`. The client can't push prices.
5. **Server-side re-pricing** (`priceCart(selections)`) reads `data/menu.ts` and rebuilds every line item. Throws `PricingError` if a referenced item/size/addon/flavor doesn't exist.
6. **Order code generation with retry** — `generateOrderCode()` returns a 6-char Crockford base32 string (~32^6 = ~1B values, but the live history is small so collisions are vanishingly rare). On Mongo's `P2002` unique-constraint violation, the loop retries up to 3 times. Anything else bubbles up.
7. **Email** (`sendOrderEmail`) — fire-and-forget; failure is logged but the order POST still returns 201. Email-delivery flakiness must not lose orders.
8. **Response** — `{ orderId, viewToken, totals, paymentMethod, paymentStatus }`. The `viewToken` is the magic that protects the confirmation page from being enumerable.

### 7.5 `lib/pricing.ts` — why client prices don't matter

`priceCart(selections)` builds `PricedCartItem[]` from `menu.ts`. Every dollar value (`basePrice`, `unitPrice`, `price`, line totals, subtotal, tax, total) is computed here on the server. If the client tried to send `unitPrice: 0`, the field is simply ignored — Zod's `safeParse` would also reject any extra fields if the schema is strict.

`TAX_RATE` lives in `lib/config.ts` (13% HST for Ontario). The order-create path computes `tax = round2(subtotal * TAX_RATE)` and `total = subtotal + tax`. The dashboard never recomputes — it trusts the stored totals.

### 7.6 `lib/orderCode.ts` — 6-character codes

Uses **Crockford base32** (a subset of base32 that drops the visually-ambiguous letters `I L O U`). 6 chars from a 32-symbol alphabet → ~10⁹ possible codes. The unique constraint in Mongo prevents collisions; the 3-retry loop in the API route handles the rare race.

Why 6 chars: it fits on a paper receipt without wrapping, staff can read it back over the phone, customers can spell it out. The `viewToken` (128-bit random) does the security work.

### 7.7 `lib/orderStore.ts` — persistence layer

Wraps Prisma. Key entrypoints:

- **`createOrder({ orderCode, items, pickupDetails, subtotal, tax, total })`** — `randomBytes(16).toString("base64url")` generates the 128-bit `viewToken`; Prisma `prisma.order.create` writes the document.
- **`listRecentAndActive({ windowHours, limit })`** — single Mongo find using the `orderStatus + createdAt DESC` composite index. Returns active orders (`new | acknowledged | ready`) regardless of age, plus any other orders within `windowHours`. Limit 500 so a slow night doesn't load a year of history.
- **`updateStatus(orderCode, nextStatus)`** — sets the status + the matching audit timestamp (`acknowledgedAt`, `readyAt`, etc.). Old `"preparing"` documents (the deprecated status) are normalized to `"acknowledged"` on read.
- **`getOrderByCodeWithToken(orderCode, viewToken)`** — the customer-facing lookup. Uses `timingSafeString.equal()` to compare tokens so an attacker can't time-side-channel guess tokens by status response timing.

### 7.8 `lib/orderingStatus.ts` + `lib/hours.ts` + `lib/restaurantSettings.ts` — the open/closed gate

Three pieces compose into one `getOrderingAvailability()` answer:

| Layer | Source | Affects |
|---|---|---|
| Business hours | `lib/hours.ts` — Toronto-local weekly schedule + holiday list | `closed`-reason if outside |
| Staff pause toggle | `RestaurantSetting{key: "online_ordering_paused"}` doc | `staff-paused` reason if on |
| Composite answer | `lib/orderingStatus.ts::getOrderingAvailability()` | `accepting`, `reason`, `message` |

`POST /api/dashboard/orders/pause` flips the `online_ordering_paused` setting. The customer storefront's `<OrderingAvailabilityBanner>` polls `/api/order/availability` and shows the appropriate message ("Kitchen is on break — try again in 20 min").

Holidays are a hand-maintained list; an enhancement note in the PRD calls for a small admin UI but for a single-restaurant scale, a code change + redeploy is fine.

### 7.9 `lib/rateLimit.ts` — seven limiters, one factory, one shared key helper

`makeLimiter(factory)` returns a `{ limit(key) }` object. The factory takes a Redis instance and returns an `@upstash/ratelimit` `Ratelimit` configured per its bucket.

| Limiter | Window | Why |
|---|---|---|
| `loginRateLimit` | 5 / 1 min | Brute-force defense on the staff password |
| `orderRateLimit` | 10 / 1 min | Stop accidental double-tap submits and casual abuse |
| `contactRateLimit` | 5 / 10 min | Stop spam |
| `dashboardWriteRateLimit` | 60 / 1 min | Staff can tap fast but not infinitely |
| `dashboardReadRateLimit` | 120 / 1 min | Board polling + single-order detail GETs; stops a hijacked cookie from scraping the whole history |
| `dashboardSearchRateLimit` | 30 / 1 min | Search hits the DB harder than the board fetch |
| `orderStatusRateLimit` | 60 / 1 min | Customer poll, token-gated |

If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` aren't set:
- **Dev** (`NODE_ENV !== "production"`): each limiter no-ops and warns *once*. Same one-time boot warning from `instrumentation.ts` as before.
- **Prod** (`NODE_ENV === "production"`): each limiter returns `success: false` so the handler emits `429 Too Many Requests`. A misconfigured prod deploy fails loudly instead of silently disabling every rate limit.

`getClientIp(req)` reads `X-Forwarded-For` (first hop) then `X-Real-IP` then falls back to `"unknown"` — un-identifiable requests share one bucket, which over-limits bots but is intentional.

`dashboardRateLimitKey(req)` is the shared key builder for every `/api/dashboard/*` limiter call: it hashes the session cookie (`sha256` → 32-char hex prefix) so per-session keys never embed the raw token, and falls back to `getClientIp(req)` when the cookie isn't present yet (e.g. login). One whole restaurant behind a single NAT therefore gets one bucket *per tablet session*, not one bucket per public IP.

### 7.10 `lib/dashboardAuth.ts` — HMAC-signed session cookies

```ts
function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + DASHBOARD_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `v1.${issuedAt}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}
```

Tokens are `v1.<issuedAt>.<expiresAt>.<sha256-hmac>`. The cookie is `HttpOnly`, `Secure` (prod), `SameSite=Lax`, 12-hour TTL. `verifySessionToken` does three checks: version match, **constant-time signature comparison** (`timingSafeEqual` on Buffer-decoded hex), and not-expired. Any mismatch returns false silently — never reveals which check failed.

`verifyDashboardPassword(submitted)` sha256-hashes both the submitted and expected passwords to fixed 32-byte digests, then `timingSafeEqual`-compares them. There is no early length check, so password length is not observable via response timing. Throws nothing on bad inputs.

`getSecret()` enforces a 16-char minimum on `DASHBOARD_SESSION_SECRET` and throws at boot if missing — fail-fast over silent insecurity.

### 7.11 `app/api/dashboard/login/route.ts` (referenced)

Walks through:
1. Same-origin check.
2. `loginRateLimit` (per IP).
3. Parse `{ password }`.
4. `verifyDashboardPassword(password)` — bcrypt-free; the shared password is set in env, not stored in DB. (For a multi-staff system you'd want per-user accounts; for one restaurant with rotating staff, one shared password + monthly rotation is the right amount of process.)
5. `createSessionToken()` → `Set-Cookie: gc_dashboard_session=...; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`.

### 7.12 `lib/requireDashboardSession.ts` — the page gate

```ts
export async function hasDashboardSession(): Promise<boolean> {
  const c = await cookies();
  return verifySessionToken(c.get(DASHBOARD_COOKIE_NAME)?.value);
}
```

Used by `/dashboard/page.tsx` (server component). For API routes, the equivalent helper throws a typed `UnauthorizedError` that the handler catches and converts to 401. The dashboard layout never renders for unauth'd users — there is no client-side flash.

### 7.13 `components/dashboard/OrderBoard.tsx` — the 572-line client

The biggest single component in the codebase. Responsibilities:

- Holds `orders[]` and `availability` in client state (seeded by the server).
- Polls `GET /api/dashboard/orders` every `pollIntervalMs` (default 6000ms). On poll, diffs incoming vs current to detect new orders.
- New order detected → `useNewOrderAlarm` plays the chime (single-cycle, user-interaction-gated for browser autoplay policy), `NewOrderToast` slides in for 8s.
- Renders cards in two sections: **Active** (new/acknowledged/ready) and **Recent** (completed/cancelled). Active updates with a layout animation.
- Per-card actions (`Acknowledge`, `Ready`, `Complete`, `Cancel`) → `PATCH /api/dashboard/orders/<orderId>` with the new status. Optimistic UI: state updates locally, then sync from server on next poll. On API failure, the optimistic update is rolled back.
- `OrderDetailsDrawer` opens on tap — shows full cart, customer name/phone, staff note edit.
- `<PauseOrdersControl>` toggles the staff-pause flag; the change reflects immediately in the customer banner on next poll.
- Tablet ergonomics: 44px+ hit targets, big text, sound chime, no hover states.

### 7.14 `components/cart/cart-context.tsx` — React Context cart

Singleton context exposing `items`, `subtotal`, `itemCount`, `addItem`, `updateItemQuantity`, `updateItemNotes`, `removeItem`, `duplicateItem`, `clearCart`, plus `checkoutSheetOpen` for the mobile sheet. Live in memory only — closing the tab clears the cart, by design (no zombie carts to confuse customers). The provider wraps everything inside `app/layout.tsx`.

Cart math runs client-side too for *display only*; the server re-prices on submit. So the customer sees a UI total while typing, but the dollars that get charged are computed authoritatively.

### 7.15 `app/api/cron/heartbeat/route.ts` — keeping Atlas + Upstash awake

```ts
await prisma.$runCommandRaw({ ping: 1 });
const redis = await pingRedis();
```

Once a week, Vercel hits this with `Authorization: Bearer <CRON_SECRET>`. `timingEqual()` does constant-time comparison. The Mongo ping is authoritative: on failure, log and return 500 — Vercel surfaces failed crons in the dashboard so the operator notices. The Redis ping (`pingRedis()` in `lib/rateLimit.ts`, which reuses the shared Upstash client) is best-effort — the request itself is the keepalive traffic, so a transient Redis error is reported in the response but never fails the heartbeat. On success the route returns `{ ok: true, ts, mongo: "ok", redis }`.

Why Monday 9am UTC: it's safely outside Toronto restaurant peak hours (which are late afternoon / evening local time).

### 7.16 `instrumentation.ts` — boot warnings

```ts
export function register() {
  if (!ratelimitConfigured()) {
    console.warn(
      "[boot] rate limiting is DISABLED. Set UPSTASH_REDIS_REST_URL and ...",
    );
  }
}
```

Next.js calls this on first request (or at boot in some runtimes). The single console.warn in production is enough to make me notice if I shipped a deploy without the env var.

---

## 8. Database Schema

```prisma
model Order {
  id                String    @id @default(auto()) @map("_id") @db.ObjectId
  orderCode         String    @unique           # 6-char Crockford base32

  paymentMethod     String    @default("pay_in_person")
  paymentStatus     String    @default("unpaid")

  orderStatus       String    @default("new")  # new | acknowledged | ready | completed | cancelled
  source            String    @default("website")

  pickupName        String
  pickupPhone       String
  pickupEmail       String?
  pickupTimeOption  String                      # "asap" | "later"
  pickupTime        String?

  itemsJson         String                      # JSON-encoded cart
  subtotal          Float
  tax               Float
  total             Float

  staffNote         String?
  viewToken         String?                     # 128-bit base64url

  acknowledgedAt    DateTime?
  readyAt           DateTime?
  completedAt       DateTime?
  cancelledAt       DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([orderStatus])
  @@index([createdAt])
  @@index([orderStatus, createdAt(sort: Desc)])  # the dashboard's hot query
  @@index([pickupName])
  @@index([pickupPhone])
}

model RestaurantSetting {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  key       String   @unique     # e.g. "online_ordering_paused"
  value     String                # JSON-encoded value (shape can change per key)
  updatedAt DateTime @updatedAt
}
```

The composite `(orderStatus, createdAt DESC)` index is what keeps the dashboard's board query fast — it can serve "active orders by recency" without scanning. Phone/name indexes accelerate the dashboard search; substring search still scans, but exact and prefix queries are O(log n).

`itemsJson` is stored as a JSON string rather than as a sub-document because Prisma's Mongo support for arbitrary nested arrays-of-shapes was awkward at the time this was wired up. Keeping it as a string lets the app evolve cart shape freely (new option types, etc.) without migrations.

---

## 9. Security Model

| Threat | Mitigation |
|---|---|
| **CSRF on POSTs** | `isSameOrigin(req)` check on every mutating route |
| **Brute-force login** | `loginRateLimit` (5/min/IP) + sha256-then-`timingSafeEqual` password compare (no length leak) |
| **Cookie forgery** | HMAC-SHA256 signed session token, `HttpOnly`, `Secure`, `SameSite=Lax` |
| **Session theft** | `HttpOnly` cookie + Vercel's HTTPS-only domain |
| **Order enumeration** | 128-bit `viewToken` checked with `timingSafeEqual` |
| **Price tampering** | Server re-prices cart from `menu.ts`; client prices ignored |
| **Spam orders** | `orderRateLimit` (10/min/IP) + prod-only fail-closed if Redis env missing (returns 429 instead of silently disabling) |
| **Dashboard scrape via hijacked session** | `dashboardReadRateLimit` (120/min/session) on every dashboard GET; `dashboardRateLimitKey` hashes cookie so it's per-tablet, not per-NAT |
| **Email header / subject injection** | `sanitizeOneLine` strips CR/LF from any user-supplied string interpolated into `Resend` headers or single-line body fields |
| **Storefront silently accepts orders during DB outage** | `/api/order/availability` fail-closed catch returns `accepting: false` with `degraded: true` |
| **Spam contact** | `contactRateLimit` (5/10min/IP) |
| **Cron endpoint abuse** | `Authorization: Bearer <CRON_SECRET>` checked with `timingSafeEqual` |
| **Header sniffing** | HSTS preload, `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, Permissions-Policy declared in `next.config.ts` |
| **Stripe key leak** | N/A — Stripe was removed; no payment secrets in the codebase |

Every hand-rolled comparison uses `timingSafeEqual` on Buffer-decoded inputs. No `===` on secrets.

---

## 10. Data Flow End-to-End

Customer places an order:

```
Browser                      Next.js (Vercel)              MongoDB         Upstash         Resend
   |                             |                            |                |               |
   |-- GET /menu --------------->|                            |                |               |
   |<-- HTML (static menu.ts) ---|                            |                |               |
   |                             |                            |                |               |
   |   user builds cart          |                            |                |               |
   |   (CartProvider in memory)  |                            |                |               |
   |                             |                            |                |               |
   |-- POST /api/order --------->|                            |                |               |
   |                             |-- isSameOrigin OK?         |                |               |
   |                             |-- orderRateLimit ---------------------------------->        |
   |                             |<-- {success:true} ---------------------------------|        |
   |                             |-- getOrderingAvailability  |                |               |
   |                             |--------------------------->| (hours + paused doc)|          |
   |                             |<-- accepting:true ---------|                |               |
   |                             |-- orderRequestSchema.safeParse              |               |
   |                             |-- priceCart(selections)                     |               |
   |                             |-- generateOrderCode + createOrder           |               |
   |                             |--------------------------->| INSERT order   |               |
   |                             |<-- {id, viewToken, …} -----|                |               |
   |                             |-- sendOrderEmail (async) ------------------------->         |
   |<-- 201 + body --------------|                            |                |               |
   |                             |                            |                |               |
   |-- navigate /order/confirmation?id=…&t=…                  |                |               |
   |                             |                            |                |               |
   |-- GET /api/order/status     |                            |                |               |
   |   (every 8s, with viewToken)|                            |                |               |
   |                             |-- orderStatusRateLimit --------------------->|              |
   |                             |-- getOrderByCodeWithToken ->| timingSafeEq |                |
   |                             |<-- order ------------------|                |               |
   |<-- {orderStatus, …} --------|                            |                |               |
```

Staff acknowledges:

```
iPad                         Next.js                       MongoDB
 |                              |                            |
 |-- (already polling /api/dashboard/orders every 6s) -------|
 |                              |                            |
 |-- tap "Acknowledge" -------->|                            |
 |-- PATCH /api/dashboard/orders/<code>                      |
 |   { orderStatus: "acknowledged" }                         |
 |                              |-- hasDashboardSession      |
 |                              |-- dashboardWriteRateLimit  |
 |                              |-- updateStatus             |
 |                              |--------------------------->| UPDATE order
 |                              |                            |  set acknowledgedAt, orderStatus
 |                              |<-- ok                      |
 |<-- 200 -----------------------|                            |
 |   optimistic UI already showed acknowledged; reconciled   |
```

---

## 11. Plain-English Glossary

**App Router (Next.js):** Next.js's modern routing model where files in `app/` map to URL segments. `page.tsx` is a page; `route.ts` is an API handler; `layout.tsx` is a persistent wrapper. Replaces the older `pages/` API.

**Audit timestamp (`acknowledgedAt`, etc.):** A column set by the server when a status transition happens. Lets the dashboard show "ready 3 min ago" and supports later reporting on kitchen throughput.

**Cart context (React):** The `CartProvider` exposing the in-memory cart via a `useCart()` hook. Cart is intentionally not persisted across tabs/sessions; closing the page loses it.

**Composite index (Mongo):** An index spanning multiple fields, e.g., `(orderStatus, createdAt DESC)`. Lets the database serve "find all active orders, sorted newest first" without a sort step.

**Crockford base32:** A subset of base32 with the visually-ambiguous letters (I, L, O, U) removed. 32 symbols ⇒ 6 chars per code ≈ 1 billion possibilities.

**CSRF (Cross-Site Request Forgery):** An attacker tricks the user's browser into submitting an unwanted POST to your site. Mitigation here is the same-origin check, plus `SameSite=Lax` on cookies.

**Edge runtime vs Node runtime:** Next.js can run route handlers in either. The Node runtime is required for Prisma + MongoDB. Every API route in this project sets `export const runtime = "nodejs"`.

**Fail-fast (boot):** Throw immediately at process start if a required env var is missing or too short, rather than failing later in a request. `getSecret()` in `dashboardAuth.ts` is an example.

**HMAC-SHA256:** Hash-based Message Authentication Code using SHA-256. Used here to sign the dashboard session cookie so the server can verify a cookie wasn't tampered with — without storing per-session state in the DB.

**`HttpOnly` cookie:** A cookie flag preventing JavaScript from reading the cookie. Defends against XSS-driven session theft.

**Idempotency on retry (P2002):** When the unique-constraint violation `P2002` fires (duplicate `orderCode`), the API regenerates a new code and retries up to 3 times — safe because the prior partial work was rolled back.

**Order code (`orderCode`):** A 6-char Crockford base32 string per order. The customer-facing identifier — short enough to read aloud over the phone.

**Order status state machine:** `new → acknowledged → ready → completed`, plus `cancelled` as a terminal sibling. Transitions are server-validated; the dashboard buttons map to the next legal state.

**Pay-in-person:** All orders are placed online but paid at the counter at pickup. The codebase has no payment integration today; an earlier Stripe integration was deliberately removed.

**Pause toggle (`online_ordering_paused`):** A `RestaurantSetting` doc that staff can flip to stop the storefront from accepting orders without a code deploy. Surfaced as an `<OrderingAvailabilityBanner>` on the customer side and as `<PauseOrdersControl>` on the dashboard.

**`priceCart` (server re-pricing):** Recomputes every cart total from `data/menu.ts`. Client-supplied prices are *ignored* — the only trusted source of pricing is the server's menu data.

**Prisma:** A TypeScript-first ORM. Generates a fully typed client from `schema.prisma` and abstracts the Mongo driver. `postinstall` runs `prisma generate` so the client is always fresh.

**Rate limit (sliding window):** A request quota measured over a rolling window. E.g., 10 per minute means "no more than 10 requests in any 60-second window." Implemented via `@upstash/ratelimit` on Redis.

**Resend:** A transactional email service. Wrapped in `lib/email.ts`; failure to send doesn't fail the order POST.

**Route group (`(site)`):** A folder name wrapped in parens. Exists in the filesystem but doesn't show in the URL. Used to share a layout with one set of pages without affecting URLs.

**Same-origin check:** `req.headers.get("origin")` must match the deployed host. CSRF defense for state-changing POSTs.

**Server component / client component:** Server components run only on the server and ship no JS. Client components ship interactive JS. `OrderBoard.tsx` is a client component (`"use client"`); `page.tsx` files default to server components.

**`SameSite=Lax`:** A cookie attribute that prevents the cookie from being sent on cross-site top-level POSTs. Combined with the same-origin check, it stops CSRF.

**Staff pause:** See "Pause toggle."

**`timingSafeEqual`:** Node's constant-time comparison. Required for any compare on secret material (tokens, passwords) so the server doesn't leak information via response timing.

**Toronto-local hours (`lib/hours.ts`):** The business-hours schedule, evaluated in `America/Toronto` time zone. Handles DST automatically via the standard `Intl` API.

**View token (`viewToken`):** A 128-bit random base64url string stored per order. Required to view the confirmation page. Without it, knowing an order code alone is useless — defeats enumeration.

**Vercel Cron:** Vercel's built-in cron scheduler. Hits a configured route on a schedule with a Bearer token (`CRON_SECRET`). Used here for the weekly Mongo + Redis heartbeat.

**Upstash Redis:** A serverless Redis. Used for sliding-window rate limits across Vercel's many serverless instances (an in-process limiter would each-instance-allow N requests; the Redis store coordinates).

**Zod:** TypeScript-first schema validation. Every API request body is `safeParse`-d before any logic runs.

---

## 12. Common Tasks

### Add a menu item

1. Open `data/menu.ts`.
2. Append to the appropriate category. Required fields: `id`, `categoryId`, `name`, `description`, `price`. Optional: `image`, `tags`, `availableSizes`, `availableAddons`, `availableFlavors`, `defaultSizeId`.
3. If you reference a new image, drop it under `public/images/Ginger-Food-Photos/` and add to `MENU_IMAGES`.
4. Commit + push. Vercel rebuilds; menu update is live.

There is no DB write — the menu is static. That's fine because the menu changes monthly at most, and updates happen alongside other code changes.

### Change the tax rate

`lib/config.ts` → `TAX_RATE`. Save, redeploy. Existing orders keep their stored tax; new orders use the new rate.

### Add a new dashboard action

1. Add the action button to `OrderCard.tsx`.
2. Wire its `onClick` to a new `PATCH` against `/api/dashboard/orders/[orderId]`.
3. Extend the handler in `app/api/dashboard/orders/[orderId]/route.ts` — validate the action via Zod, call `updateStatus(orderCode, newStatus)` (or a new helper).
4. Add the new status to the state machine in `lib/types.ts` if needed.

### Rotate the staff dashboard password

1. Change `DASHBOARD_PASSWORD` in Vercel env (Production).
2. Trigger a redeploy.
3. Current sessions remain valid until their 12h cookie expires; staff log in with the new password next time.
4. To force everyone out *now*, also rotate `DASHBOARD_SESSION_SECRET` — every existing token fails signature verification.

### Add a new env-driven feature flag

Add a key to `lib/restaurantSettings.ts`, a setter to the dashboard pause endpoint (or a new admin endpoint), and read it via `getSetting<T>("my_flag")` server-side. Surfaces immediately on next page load — no deploy needed.

### Re-enable Stripe (or any payment provider)

Resurrect it as a separate concern: add a `paymentIntent` step *after* `createOrder` but *before* the 201, with order `paymentStatus = "pending"` until the webhook confirms. Don't blend payment failure into order creation — the v1 codebase regretted that.

---

## 13. Troubleshooting

**Customer says "I never got the email."**

Resend dashboard → check the order's recipient. Most common: the customer typo'd their email. Confirm with their phone number, then resend manually from the dashboard (or, ideally, add a "resend email" button — currently planned).

**Dashboard sound chime doesn't fire.**

Browser autoplay policy: audio elements can't play until the user has interacted with the page. The dashboard arms the audio after the first click anywhere. If staff power-cycled the iPad, the first new order will be silent until someone taps the screen.

**Order POST returns 503 "we're not accepting orders."**

Either business hours (`lib/hours.ts`) or the staff-pause flag. Check the dashboard's pause control; if it's off, check the time vs the configured hours. Holidays are hand-maintained in `lib/hours.ts`.

**`Error: DASHBOARD_SESSION_SECRET is missing or too short`**

The env var either isn't set or is shorter than 16 chars. Set it in Vercel; redeploy. This fail-fast is intentional — running without a secret is worse than not running.

**Atlas paused the cluster.**

Reactivate via the Atlas dashboard. Then check that `vercel.json` has the cron entry and `CRON_SECRET` is set in Vercel; without that, the weekly heartbeat doesn't run and Atlas will pause again in 30 days.

**Every API endpoint returns 429 in production right after a deploy.**

The Upstash env vars aren't set, so `makeLimiter` is in prod fail-closed mode and refusing every rate-limited request by design. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel env, redeploy. (Dev still no-ops with a single boot warning from `instrumentation.ts`.)

**Order code collision.**

The `POST /api/order` retries up to 3 times on `P2002`. If you see "Could not assign an order number" in production logs, the codespace is unusually full — either the orderCode generator is broken, or there are far more historical orders than expected. Verify by counting `db.orders.count()` and sanity-checking the generator's entropy.

**Confirmation page shows "Order not found."**

Either the `id` or the `t` (viewToken) is wrong. The customer probably bookmarked an old URL or got a truncated link in their email. Look up the order in the dashboard; reissue a link manually if needed.

**Dashboard list shows orders frozen in `acknowledged` after a deploy.**

If you renamed a status enum, old documents may hold the previous string. The `normalizeOrderStatus` mapper in `orderStore.ts` is the safety net (currently maps deprecated `"preparing"` → `"acknowledged"`); add new mappings there as the state machine evolves.

**Prisma client out of date.**

`postinstall` runs `prisma generate`. If you skipped install (`npm ci --omit-scripts` or similar), re-run `npx prisma generate`. The build script also includes it (`prisma generate && next build`).

**MongoDB driver crashes "Connection pool closed" intermittently.**

Vercel serverless functions can be invoked on cold containers; the Prisma client must be a module-scope singleton (it is — see `lib/prisma.ts`). If you see this, verify nobody created a new `PrismaClient()` inside a handler.

**`/api/cron/heartbeat` returns 401 from Vercel Cron.**

`CRON_SECRET` mismatch between Vercel's env and what Vercel Cron is sending. Vercel sends the value you set as `CRON_SECRET` — if you renamed the env var, the heartbeat fails silently every Monday. Check it against the route's `process.env.CRON_SECRET`.

**Order arrives with `total = 0`.**

The cart pricing path threw a `PricingError` but somehow proceeded. Should be impossible (the catch block returns 400 before `createOrder`). If it happens, double-check `priceCart()` for an early-return that bypasses the throw.
