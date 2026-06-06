# End-to-end tests (Playwright)

Covers the owner menu-management feature end to end: dashboard edits → customer
site reflects them → server enforces them.

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
from `.env.local` as usual. Upstash isn't required — rate limiting no-ops in dev.

## Run

```
npm run e2e         # headless
npm run e2e:ui      # interactive UI mode
npm run e2e:report  # open the last HTML report
```

Playwright starts its own dev server on **port 3100** with `DATABASE_URL` pointed
at `TEST_DATABASE_URL`, so a normal `next dev` on 3000 is left untouched.

## What's covered (`e2e/menu.spec.ts`)

1. **Base item sold-out** → customer `/menu` shows the "Sold out" badge and a
   disabled Add-to-cart.
2. **Base item price override** → customer card shows the new price; add enabled.
3. **Custom item CRUD** → add → edit price → verify on the customer site →
   delete → verify it's gone.
4. **Server gate** → a crafted `POST /api/order` for a sold-out item is rejected
   (400 "sold out"). **Skips automatically when ordering is closed** (business
   hours / pause), since the API returns 503 then; the gate is also covered by
   the `lib/pricing` unit tests regardless.

## Out of scope

- **Photo upload** is intentionally not exercised (custom items are added without
  a photo) to keep tests free of the external Blob dependency.
- **CI** isn't wired yet — local only.

## Notes

- Tests run serially (`workers: 1`) because they share menu-customization state.
- Auth is done once in `e2e/auth.setup.ts`; the saved session is reused via
  `storageState` (gitignored under `e2e/.auth/`).
- Selectors rely on `data-testid` hooks in `MenuManager.tsx` / `MenuPageClient.tsx`.
