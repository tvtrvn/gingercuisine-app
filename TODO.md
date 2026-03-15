# TODO

## Current Status

Core ordering flow is live and working:
- Next.js + TypeScript + Tailwind storefront
- Menu customizations (sizes + add-ons)
- Pay-at-pickup + Stripe Checkout
- Stripe webhook finalization
- MongoDB persistence via Prisma
- Resend email notifications

---

## Next (Admin Operations)

- [ ] Build `/admin/orders` dashboard (kitchen view)
- [ ] Auto-refresh orders every 3-5 seconds (polling fallback)
- [ ] Add order status workflow:
  - `new -> confirmed -> in_progress -> completed`
  - include `cancelled` path
- [ ] Add quick "Confirm" action for new orders
- [ ] Add basic admin protection (shared key/password route guard)

---

## Realtime Alerts (Phase 2)

- [ ] Add Pusher or Ably integration for live order events
- [ ] Push event on new order creation (pay-at-pickup + Stripe webhook)
- [ ] Kitchen alert UI for new orders:
  - flashing indicator
  - optional sound notification
  - unconfirmed order badge counter
- [ ] Keep polling enabled as fallback if realtime provider is down

---

## Reliability + Security

- [ ] Add request rate limiting for:
  - `/api/order`
  - `/api/order/stripe`
  - `/api/contact`
  - `/api/stripe/webhook`
- [ ] Add simple structured logging and error tracking
- [ ] Add webhook monitoring/alerting for failed Stripe events
- [ ] Add retention/cleanup policy for stale `StripePendingOrder` documents
- [ ] Add indexes review/checklist for `Order` query patterns

---

## Product Improvements

- [ ] Add customer order confirmation email (optional)
- [ ] Add internal order note field for staff
- [ ] Add searchable order history in admin page
- [ ] Add "Ready for pickup" SMS/email notification
- [ ] Add business closed-hours ordering guard

---

## Deployment Checklist (Each Release)

- [ ] Pull latest + install deps
- [ ] `npx prisma generate`
- [ ] `npx prisma db push` (if schema changed)
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual smoke test:
  - homepage/menu load
  - add to cart
  - pay-at-pickup order
  - Stripe test payment + webhook 200
  - order record appears in MongoDB

