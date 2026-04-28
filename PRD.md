# Ginger Cuisine Ordering Platform PRD

## 1. Product Summary

Ginger Cuisine is a pickup ordering website and staff dashboard for a family-run Vietnamese restaurant. Customers browse the menu, customize items, submit pickup details, and place orders online. Payment is collected in person at pickup. Restaurant staff use a separate password-protected tablet dashboard to view incoming online orders, acknowledge them, walk them through ready and completed, and manually enter them into the existing POS.

The product intentionally avoids online payment and direct POS integration. Its job is to make online ordering clear for customers and operationally useful for restaurant staff while keeping the implementation simple, affordable, and deployable on common free/low-cost hosting services.

## 2. Goals

- Let customers place pickup orders without creating an account.
- Keep checkout simple: online order submission, in-person payment.
- Give restaurant staff a reliable real-time-ish dashboard for incoming orders.
- Show every order detail clearly enough that staff can manually enter the order into their existing POS without an in-app toggle.
- Prevent customers from accessing the staff dashboard.
- Recompute all prices server-side so users cannot manipulate totals.
- Keep the app practical for production deployment on Vercel with MongoDB, Resend, and Upstash.
- Make menu maintenance straightforward through `data/menu.ts`.

## 3. Non-Goals

- No Stripe or online payment processing.
- No automated POS integration.
- No customer accounts, loyalty program, or stored payment methods.
- No delivery-driver workflow.
- No multi-restaurant admin portal in the current version.
- No live kitchen display hardware integration beyond the web dashboard.

## 4. User Groups

### Customers

Customers are people ordering pickup from Ginger Cuisine. They may be on mobile or desktop. They need a simple menu, clear prices, customization options, pickup details, and a confirmation screen.

### Restaurant Staff

Staff use the dashboard on a tablet or computer inside the restaurant. They need to see new orders quickly, hear/see notifications, walk an order through acknowledged/ready/completed, manually enter the order in their existing POS, and search older orders when needed.

### Owner / Maintainer

The owner or developer maintains menu data, images, environment variables, dashboard credentials, deployment settings, and production readiness.

## 5. Current Product Scope

### Customer Site

Routes include:

- `/` home page.
- `/menu` full menu with filtering, images, sizes, flavors, add-ons, tags, and availability notes.
- `/order` pickup ordering flow with cart and customer details.
- `/order/confirmation` confirmation page gated by a per-order view token.
- `/about`, `/location`, and `/contact`.

Customer capabilities:

- Browse menu categories and items.
- Select sizes such as small/large soup or coconut water.
- Select flavor-style choices such as drink flavors, cake options, or Classic Beef Pho beef choice.
- Select add-ons allowed by each specific menu item.
- Add item notes.
- Submit pickup details.
- Place an order with payment due in person.

### Staff Dashboard

Dashboard route:

- `/dashboard`

Dashboard capabilities:

- Login with staff password.
- See incoming orders in workflow columns: **New → Acknowledged → Ready → Completed**, plus **Cancelled**.
- Receive new-order visual/audio notification.
- View complete order details.
- Mark order as acknowledged, ready, completed, or cancelled.
- Search older orders by name, phone, or order number.

## 6. Key Workflows

### Customer Order Workflow

1. Customer opens the menu or order page.
2. Customer chooses menu items and options.
3. Customer reviews the cart.
4. Customer enters name, phone, optional email, and pickup time preference.
5. App sends only selection references to the server, not trusted prices.
6. Server validates selections and recomputes prices from `data/menu.ts`.
7. Server creates the order in MongoDB with `paymentMethod: "pay_in_person"` and `paymentStatus: "unpaid"`.
8. Restaurant receives an email notification via Resend.
9. Customer lands on a confirmation page that requires the generated view token. When the token matches, the page also surfaces `PICKUP_READY_NOTICE` ("Your order should be ready in 10–15 minutes.") so the customer knows roughly when to head over.
10. Customer pays at the restaurant during pickup.

### Staff Dashboard Workflow

1. Staff logs into `/dashboard`.
2. Dashboard loads active orders plus recent completed/cancelled orders.
3. Dashboard polls periodically for updates.
4. New orders appear in the New column with notification.
5. Staff opens order details and manually enters the order into the existing POS.
6. Staff progresses status through **acknowledged → ready → completed**.
7. Staff can cancel orders when needed.
8. Staff can search older orders without loading all historical orders into the board.

## 7. Functional Requirements

### Menu Requirements

- Menu data is maintained in `data/menu.ts`.
- Every menu item has an id, category, name, description, price, and optional image.
- Items may support:
  - `availableSizes` for size or base choices.
  - `availableFlavors` for mutually exclusive choices.
  - `availableAddons` for optional extras.
  - dietary tags: `spicy`, `vegetarian`, `vegan`.
- Vegan items must also show vegetarian.
- Drinks and desserts show an availability note: options may change based on availability.
- New `PhoGinger-*` assets should be mapped in `MENU_IMAGES` when they clearly match an item.

### Menu Customization Rules

- Classic Beef Pho supports rare beef, well-done beef, or both.
- Soup add-ons include rice noodle but not grain.
- Starter soups support an add rice noodle option.
- Rice plates use dish-specific meat add-ons and may offer Switch to Fried Rice for $1.
- Vermicelli bowls use dish-specific meat add-ons and replace grain with Vermicelli noodle.
- Extra Meat & Protein side excludes rice noodle because rice noodle is its own side.
- Butter Chicken Specialty Plate supports a base choice of rice or naan at the same price.
- Butter Chicken supports extra rice and extra naan as add-ons for $4 each.
- Sides include Naan and Rice noodle as standalone items.

### Order Requirements

- The customer can place only pay-in-person orders.
- The system must not send client-controlled prices to the server as trusted values.
- Server-side pricing must reject invalid item ids, size ids, flavor ids, and add-on ids.
- Order totals must include subtotal, tax, and total.
- Orders must store customer pickup details.
- Orders must store status fields for dashboard workflow.

### Email Requirements

- Restaurant receives an order email after successful order creation.
- Email includes order items, options, notes, totals, and pickup details.
- Email must not mention Stripe or online payment.

### Dashboard Requirements

- Dashboard requires authentication.
- Dashboard is separate from customer-facing routes.
- Dashboard shows the staff workflow clearly on tablets.
- Staff can update order status across `new`, `acknowledged`, `ready`, `completed`, and `cancelled`.
- Dashboard must prevent duplicate new-order notifications.
- Dashboard must keep the main view bounded by showing active orders plus recent history.
- Older orders must be searchable through the database-backed search endpoint.

### Customer Confirmation Requirements

- Confirmation page must surface the customer-friendly `PICKUP_READY_NOTICE` ("Your order should be ready in 10–15 minutes.") sourced from `lib/config.ts`, but only when the order was successfully looked up with a valid view token.

## 8. Security Requirements

- Dashboard access requires `DASHBOARD_PASSWORD`.
- Dashboard sessions use signed HttpOnly cookies.
- Session signatures and password comparisons use constant-time comparison.
- State-changing endpoints require same-origin checks through `Origin` or `Referer`.
- Rate limiting is handled with Upstash Redis in production.
- Order confirmation requires both `orderId` and a random `viewToken`.
- Dashboard and dashboard API routes must not be indexed by search engines.
- Security headers should reduce clickjacking, MIME sniffing, referer leakage, and unnecessary browser permissions.
- Secrets must live in environment variables, not source code.

## 9. Technical Architecture

### Frontend

- Next.js App Router.
- React client components for cart interactions and dashboard interactivity.
- Tailwind CSS for styling.
- Route group `app/(site)` for customer-facing pages.
- Separate `app/dashboard` routes for staff.

### Backend

- Next.js API routes handle orders, contact form submissions, dashboard login/logout, dashboard order updates, and dashboard search.
- `lib/pricing.ts` is the trusted pricing layer.
- `lib/validation.ts` defines request validation and size limits.
- `lib/orderStore.ts` is the order persistence layer.
- `lib/dashboardAuth.ts` and `lib/requireDashboardSession.ts` handle dashboard authentication.
- `lib/rateLimit.ts` wraps Upstash rate limiting.

### Database

- MongoDB is accessed through Prisma.
- Orders store menu selections, totals, pickup details, status fields, source, payment fields, and confirmation view token.
- Indexes support active/recent dashboard queries and basic search.

### Third-Party Services

- MongoDB Atlas or compatible MongoDB provider for storage.
- Resend for email delivery.
- Upstash Redis for production rate limiting.
- Vercel for deployment.

## 10. Data Model Summary

Order records include:

- `orderCode`
- item list with selected sizes, flavors, add-ons, quantities, and notes
- pickup name, phone, optional email, pickup time preference
- subtotal, tax, total
- `paymentMethod: "pay_in_person"`
- `paymentStatus: "unpaid"` or `"paid"`
- `orderStatus` — one of `new`, `acknowledged`, `ready`, `completed`, `cancelled`
- `source: "website"`
- `viewToken`
- timestamps

## 11. Non-Functional Requirements

- Mobile-first customer experience.
- Menu items and the Order Pickup "Popular dishes" list must show their photo on phones, not only on tablet/desktop. Mobile uses a full-width 4:3 image; `sm+` collapses to a left-side thumbnail.
- A weekly [Vercel Cron](https://vercel.com/docs/cron-jobs) runs `GET /api/cron/heartbeat` (guarded by `CRON_SECRET`) to ping MongoDB so a free **Atlas M0** cluster does not auto-pause after ~30 days of inactivity.
- Tablet-friendly dashboard controls.
- No dependency on long-running servers for dashboard updates.
- Reasonable free-tier usage for one restaurant.
- Main dashboard list should stay bounded and avoid infinite historical scroll.
- App should build on Vercel with Prisma client generation during build.
- Menu changes should be easy to review because `data/menu.ts` is the source of truth.
- The About page embeds a Vimeo player; if a strict Content-Security-Policy is added later, it must include `frame-src https://player.vimeo.com` and `img-src https://i.vimeocdn.com` (among normal `self` allowances) so the embed continues to work.

## 12. Deployment Requirements

Production deployment requires:

- Vercel project connected to GitHub.
- MongoDB `DATABASE_URL`.
- Resend API key/domain/from email.
- Restaurant branding and contact environment variables.
- Strong `DASHBOARD_PASSWORD`.
- Strong `DASHBOARD_SESSION_SECRET`.
- Upstash Redis REST URL and token.
- `CRON_SECRET` for the weekly MongoDB heartbeat cron (prevents Atlas M0 auto-pause).
- Stripe environment variables removed from Vercel because Stripe is not used.

## 13. Acceptance Criteria

- Customer can place a pickup order without online payment.
- Order total matches trusted server-side menu pricing.
- Invalid add-ons or forged item selections are rejected.
- Customer sees confirmation only with a valid view token.
- Restaurant receives an order email.
- Dashboard login works with configured password.
- New orders appear in the dashboard polling view.
- Staff can move an order through `new → acknowledged → ready → completed` (or `cancelled`).
- Older order search works without loading all historical orders into the board.
- The confirmation page shows the `PICKUP_READY_NOTICE` to the customer when the order resolves with a valid view token.
- Menu item options match current restaurant rules.
- Production build succeeds.

## 14. Known Constraints

- Polling is used instead of WebSockets to keep hosting simple and serverless-compatible.
- Search uses regular MongoDB queries; Atlas Search may be needed at much larger order volume.
- Dashboard uses a shared staff password instead of per-user staff accounts.
- Image assets can increase repository size; files over GitHub's 100MB limit should be compressed, hosted externally, or tracked with Git LFS.

## 15. Future Enhancements

- Per-staff user accounts and audit log.
- Daily sales/export reports.
- Admin menu editor.
- Push notifications or SMS for staff.
- Customer SMS/email confirmation.
- Scheduled order cutoffs based on restaurant hours.
- Atlas Search for large-scale order history search.
- Multi-location support if the restaurant expands.
