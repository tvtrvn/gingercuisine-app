# Ginger Cuisine — Pickup Ordering Site

Modern, mobile-first website for a family Vietnamese restaurant.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · MongoDB (via Prisma) · Resend (email) · Upstash Redis (rate limiting)

---

## What the site does

**Customer site** (`/`, `/menu`, `/order`, etc.):

- Browse menu, add items to cart (with sizes, flavors, add-ons, notes).
- Fill pickup details (name, phone, email, time).
- Place a **pay-in-person** order.
- Receive an order confirmation page; restaurant gets a Resend email.

> Payment is **always collected in person** at the restaurant at pickup. There is no online payment step.

**Restaurant dashboard** (`/dashboard`):

- Staff tablet view of all incoming online orders.
- Real-time-ish updates via polling (default 4s).
- Pop-up + chime for new orders until acknowledged.
- Kanban columns: **New → Acknowledged → Preparing → Ready → Completed**, plus **Cancelled**.
- Each order card shows customer, pickup time, full item list, totals, payment status, POS entry status, and elapsed time.
- Staff can acknowledge, progress, complete, or cancel orders, and toggle "entered in POS" after manually punching the order into the existing POS.

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
| `RESTAURANT_NAME` / `RESTAURANT_ADDRESS` / `RESTAURANT_PHONE` / `RESTAURANT_HOURS` | Branding. |
| `NEXT_PUBLIC_RESTAURANT_PHONE`             | Phone number shown publicly.                                     |
| `TAX_RATE`                                 | Tax multiplier (e.g. `0.13` for 13% HST).                        |
| `RESEND_API_KEY` / `RESEND_DOMAIN` / `RESEND_FROM_EMAIL` | Resend email config.                                |
| `RESTAURANT_ORDER_EMAIL`                   | Who receives new order notifications.                            |
| `RESTAURANT_CONTACT_EMAIL` / `NEXT_PUBLIC_RESTAURANT_CONTACT_EMAIL` | Contact form inbox.                      |
| `DATABASE_URL`                             | MongoDB connection string.                                       |
| `DASHBOARD_PASSWORD`                       | Shared staff password for `/dashboard`. Rotate regularly.        |
| `DASHBOARD_SESSION_SECRET`                 | 32+ char random string for signing the dashboard session cookie. Generate with `openssl rand -hex 32`. |
| `DASHBOARD_POLL_INTERVAL_MS` (optional)    | Poll interval ms for the dashboard (default 4000).               |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate-limiting backend. Optional for local dev, **required for production**. |

---

## Ordering & data flow

1. Customer places order on `/order` → client POSTs a list of **selection references** (`menuItemId`, `quantity`, `selectedSizeId`, `selectedAddonIds`, `selectedFlavorId`, `notes`) to `POST /api/order`. **Prices and names are not sent from the client** — they are recomputed on the server.
2. `POST /api/order` validates with Zod, calls `priceCart()` which looks up each item in `data/menu.ts` and computes `unitPrice = basePrice + sizeDelta + addons + flavor`. Totals (subtotal · tax · total) come from that trusted calculation. It then generates an `orderCode` (`GC-ABC123`), a random `viewToken` (32 hex chars), and saves to MongoDB with `paymentMethod: "pay_in_person"`, `paymentStatus: "unpaid"`, `orderStatus: "new"`, `posEntryStatus: "not_entered"`, `source: "website"`.
3. Restaurant receives a Resend email with the full order (no Stripe references).
4. Customer is redirected to `/order/confirmation?orderId=…&token=…`. The confirmation page only renders the order if the `token` matches the stored `viewToken` (constant-time compare), preventing enumeration of other customers' orders.
5. Staff tablet on `/dashboard` polls `/api/dashboard/orders` every 4s and shows the new order with a chime + toast. Staff manually enters it in the POS and presses **Mark entered in POS**, then moves the order through the workflow.

---

## Security model

| Threat                         | Mitigation                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| Unauthorized dashboard access  | `DASHBOARD_PASSWORD` + HMAC-SHA256 signed, HttpOnly, SameSite=Lax session cookie (12h). |
| Brute-force dashboard login    | Upstash rate limit: **5 attempts / min / IP** on `/api/dashboard/login`. |
| Flood of junk customer orders  | Upstash rate limit: **10 orders / min / IP** on `/api/order`. |
| Contact-form spam              | Upstash rate limit: **5 submissions / 10 min / IP** on `/api/contact`. |
| Runaway dashboard API calls    | Upstash rate limit: **60 writes / min / session** on `/api/dashboard/orders/:id`. |
| Client-forged prices           | Server recomputes every line from `data/menu.ts`; unknown items / sizes / add-ons / flavors are rejected with a 400. |
| Oversized carts / inputs       | Zod caps: 50 cart lines, 25 qty/line, 20 add-ons/line, 80-char name, 30-char phone, 120-char email, 200-char password, 300-char notes. |
| CSRF                           | Every state-changing endpoint requires `Origin` or `Referer` to match the request `Host`. |
| Confirmation-page URL leaking other customers' orders | Per-order `viewToken` required and constant-time compared. |
| Clickjacking / MIME-sniff / referer leaks | Default headers on every route: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`. `poweredByHeader: false`. |
| Dashboard indexed by search engines | `/dashboard` and `/api/dashboard` get `X-Robots-Tag: noindex, nofollow, noarchive` + `no-store`. |
| Dashboard timing attacks       | `timingSafeEqual` on both password check and session signature verify. |

> **Rate limiting degrades gracefully:** if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are missing, limiters log a one-time warning and allow all requests. Fine for first-boot local dev; **never leave this unset in production**.

---

## Real-time choice

The dashboard uses **polling** (default 4s) rather than WebSockets/SSE/Pusher/Ably. Rationale:

- Works with Vercel / Netlify / any serverless deployment (no long-lived connections needed).
- No extra dependency, no extra service account, nothing to break.
- MongoDB change streams need a long-lived Node process with replica-set access — heavier than you need.
- 4s is more than fine for a tablet at a host stand; it only takes a poll cycle or two to appear.

Duplicate notifications are avoided by the board tracking two client-side `Set<orderId>` refs: orders it has ever seen (to only fire a toast for genuinely new orders after mount) and orders it has already notified for.

---

## Directory map

```
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
    order/route.ts           POST new pay-in-person order (server-priced, rate-limited)
    contact/route.ts         POST contact form (rate-limited)
    dashboard/
      login/route.ts         POST password → signed cookie (rate-limited)
      logout/route.ts
      orders/route.ts        GET orders (scope, statuses)
      orders/[orderId]/route.ts  GET + PATCH status/POS entry (rate-limited)

components/
  cart/ (context, floating cart)
  layout/ (nav, footer, sticky button)
  order/ (cart summary, pickup form)
  dashboard/ (OrderBoard, OrderCard, OrderDetailsDrawer, NewOrderToast, StatusBadge, ElapsedTime, DashboardHeader)
  ui/

lib/
  config.ts                  env-backed config (tax, polling, etc.)
  types.ts                   shared TS types
  validation.ts              Zod schemas (with max caps)
  pricing.ts                 trusted server-side cart pricing
  prisma.ts                  Prisma client
  orderStore.ts              createOrder (+ viewToken) / getOrderById / listOrders / updateOrder
  email.ts                   Resend helpers (order + contact)
  dashboardAuth.ts           HMAC session cookie helpers + constant-time password compare
  requireDashboardSession.ts auth guards for server components + API routes
  requireSameOrigin.ts       CSRF / same-origin helper for state-changing endpoints
  rateLimit.ts               Upstash Ratelimit wrapper (graceful no-op if unconfigured)
  utils.ts                   cn(), formatCurrency()

prisma/
  schema.prisma              Order model (includes viewToken)

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
