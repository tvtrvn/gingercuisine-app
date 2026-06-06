# Vercel Blob setup — menu item photo uploads

Prerequisite for the menu-management **steps 7–8** (owner adds custom dishes
with photos). NOT needed for steps 1–6 (overrides / sold-out), which are
already built and use no Blob.

**What Blob is for here:** cloud storage for owner-uploaded dish photos. The
app can't write files to disk in production (Vercel's filesystem is read-only),
so uploads go to Blob, which returns a public URL stored as the item's `image`.

**Access model:** public read, server-gated write. Photos are public content
(every customer sees them); the security control is the *write token*, which
never leaves the server.

---

## Part A — Provisioning (you do this, ~5 min)

### 1. Create the Blob store
1. Go to the Vercel dashboard → the **gingercuisine** project.
2. Open the **Storage** tab.
3. Click **Create Database** (or **Connect Store**) → choose **Blob**.
4. Name it, e.g. `ginger-menu-images`.
5. Click **Create**, and **connect it to the gingercuisine project** when prompted.

> Creating + connecting the store auto-adds the env var
> **`BLOB_READ_WRITE_TOKEN`** to the project for Production, Preview, and
> Development. So production is handled for you — no manual paste needed there.

### 2. Confirm the token landed in project env vars
- Project → **Settings → Environment Variables** → confirm
  `BLOB_READ_WRITE_TOKEN` is present (value looks like `vercel_blob_rw_…`).
- If for some reason it's missing, open the Blob store → **`.env.local` /
  Quickstart** snippet → copy the `BLOB_READ_WRITE_TOKEN=…` line and add it
  manually under Settings → Environment Variables.

### 3. Get the token into LOCAL `.env.local`
You don't use the Vercel CLI, so copy it by hand (same as your other secrets):
1. Blob store page → **`.env.local` / Quickstart** tab → reveals the token.
2. Paste this single line into the project's local `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxx
   ```
3. Restart `next dev` so it picks up the new variable.

`.env.local` is gitignored (verified) — keep the token there only. Never commit
it, never paste the value into chat or any tracked file.

### 4. Hand off
Once the token is in both places (Vercel project env + local `.env.local`),
steps 7–8 can be built and end-to-end verified.

---

## Part B — Code wiring (done during steps 7–8 implementation)

Listed here so the setup is complete end-to-end; you don't action these.

- `npm install @vercel/blob`
- **Upload route** `app/api/dashboard/menu/upload/route.ts` (Node runtime),
  behind the existing dashboard stack (`requireDashboardApi` + `isSameOrigin`
  + rate-limit), then server-side `put()`. Hardening:
  - read `await req.arrayBuffer()`, reject `byteLength > 5_000_000` (5 MB cap)
  - validate **magic bytes** (jpeg/png/webp/avif) — do NOT trust the
    `Content-Type` header
  - server-generated key `menu-items/<uuid>.<ext>` (ignore client filename)
  - `access: "public"`; return only the URL; token stays server-side
- **Auto-clean on delete/replace:** when a custom item with a Blob `image` is
  deleted (or its photo replaced), call `del(url)` from `@vercel/blob` in a
  try/catch so cleanup failure never blocks the operation.
- Confirm the current `@vercel/blob` `put()`/`del()` signatures via the
  `find-docs` (ctx7) skill before implementing — the SDK is version-sensitive.

---

## Quick verification checklist
- [ ] Blob store created and connected to the gingercuisine project
- [ ] `BLOB_READ_WRITE_TOKEN` shows under project Settings → Environment Variables
- [ ] `BLOB_READ_WRITE_TOKEN` line present in local `.env.local`
- [ ] `next dev` restarted
- [ ] (during 7–8) upload a test photo → returns a `…blob.vercel-storage.com/…`
      URL → renders on the menu → delete item → blob is gone
