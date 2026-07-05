# End-to-end tests (Playwright)

Covers the owner menu-management feature (dashboard edits → customer site
reflects them → server enforces them), order pricing, the paper-menu modal,
and the order/dashboard lifecycle (auth, CSRF, validation, status machine,
search, contact, and the live tablet board).

## One-time setup

These tests **write to the database** (sold-out toggles, custom items), so they
run against a **throwaway test database** — never your real/dev data.

1. Pick a separate MongoDB database. Easiest: copy your `DATABASE_URL` and change
   only the database-name segment, e.g. `…/gingercuisine` → `…/gingercuisine_e2e`.
   (A fresh database in the same Atlas cluster is fine — it's created on first write.)
2. Add it to `.env.local`:
   ```
   TEST_DATABASE_URL="mongodb+srv://…/gingercuisine_e2e?retryWrites=true&w=majority"
   ```
3. Chromium is already installed (`npx playwright install chromium` if not).

The other secrets (`DASHBOARD_PASSWORD`, `DASHBOARD_SESSION_SECRET`, …) are read
from `.env.local` as usual.

## Isolation from real email and Redis quota

Two layers make sure a local (or CI) e2e run can never send a real customer
email or consume production/Upstash rate-limit quota:

1. **`e2e/reset-db.setup.ts`** runs before every test project. It wipes the
   `menuCustomizations` and `menuAuditLog` `RestaurantSetting` rows plus every
   `Order` document in `TEST_DATABASE_URL`, so leftovers from an interrupted
   run (e.g. a stale sold-out override) can't poison later assertions. It's a
   no-op (skips) if `TEST_DATABASE_URL` isn't set.
2. **`playwright.config.ts`'s `webServer.env`** explicitly blanks
   `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`
   for the dev server it spawns — even if those are set in `.env.local` for
   normal local dev. A blank `RESEND_API_KEY` makes email sending a warn-and-skip
   no-op; blank Upstash vars make the Redis-backed rate limiters no-op in dev
   mode, so tests never touch the real quota.

## Run

```
npm run e2e         # headless
npm run e2e:ui      # interactive UI mode
npm run e2e:report  # open the last HTML report
```

Playwright starts its own dev server on **port 3100** with `DATABASE_URL` pointed
at `TEST_DATABASE_URL`, so a normal `next dev` on 3000 is left untouched.

## What's covered

**`e2e/menu.spec.ts`**

1. **Base item sold-out** → customer `/menu` shows the "Sold out" badge and a
   disabled Add-to-cart.
2. **Base item price override** → customer card shows the new price; add enabled.
3. **Custom item CRUD** → add → edit price → verify on the customer site →
   delete → verify it's gone.
4. **Server gate** → a crafted `POST /api/order` for a sold-out item is rejected
   (400 "sold out"). **Skips automatically when ordering is closed** (business
   hours / pause), since the API returns 503 then; the gate is also covered by
   the `lib/pricing` unit tests regardless.

**`e2e/order-pricing.spec.ts`** — a premium-default dish prices its base
switches correctly on `/menu`.

**`e2e/paper-menu-modal.spec.ts`** — the paper-menu modal isolates the page
(scroll lock, focus trap) on every page it's mounted on, and closes via both
the X button and a backdrop click.

**`e2e/orders.spec.ts`** — the broadest spec, covering:

- Dashboard APIs reject unauthenticated requests; wrong dashboard password is
  rejected.
- Mutating routes reject cross-origin requests (CSRF).
- Invalid JSON bodies return 400, not 500.
- Customer places an order end to end (happy path).
- Status polling requires the right `viewToken`.
- Staff can walk the order status machine end to end (via direct API calls)
  and reopen a cancelled order back to `new`, mirroring the dashboard's
  "Reopen as new" action.
- Bogus status values and unknown order codes are rejected cleanly.
- Dashboard search finds an order by customer name.
- Contact form submits successfully (email is a no-op in e2e).
- Regression check: the new-order alarm still fires while dashboard search is
  active (polling must not pause during search).

## Out of scope

- **Photo upload** is intentionally not exercised (custom items are added without
  a photo) to keep tests free of the external Blob dependency.
- **CI** isn't wired yet — local only.

## Notes

- Tests run serially (`workers: 1`) because they share menu-customization state.
- Auth is done once in `e2e/auth.setup.ts`; the saved session is reused via
  `storageState` (gitignored under `e2e/.auth/`).
- `menu.spec.ts` / `paper-menu-modal.spec.ts` selectors rely on `data-testid` hooks
  in `MenuManager.tsx` / `MenuPageClient.tsx`. `orders.spec.ts` is mostly
  API-level (`request.get/post/patch` against the route handlers directly)
  rather than UI-driven, aside from the new-order-alarm-during-search check.
