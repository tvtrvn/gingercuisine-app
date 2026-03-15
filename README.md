## Overview

This is a modern, mobile-first website for a family Vietnamese restaurant built with **Next.js (App Router) + TypeScript + Tailwind CSS**.

It includes:

- **Home**: hero, featured dishes, testimonials, mini map.
- **Menu**: searchable, filterable menu with dietary tags and “Add to cart”.
- **Order Pickup**: cart, pickup details form, tax/total, payment toggle (pay at pickup or Stripe Checkout).
- **Location/Hours**: address, hours, Google Maps embed, parking/transit notes.
- **About Us**: family story and photo placeholders.
- **Contact**: contact form that emails the restaurant, plus quick contact info.

Menu data is stored locally in `data/menu.ts` and can later be replaced by a database.

---

## 1. How to run locally

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Create your `.env.local`** (see `.env.example`):

   ```bash
   cp .env.example .env.local
   ```

   At minimum set:

   - `RESTAURANT_NAME`
   - `RESTAURANT_ADDRESS`
   - `RESTAURANT_PHONE`
   - `RESTAURANT_HOURS`

3. **Run the development server**:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

---

## 2. Environment variables (Stripe + email)

All variables are documented in `.env.example`.

- **Basic site info**

  - `NEXT_PUBLIC_SITE_URL` – base URL for the site (e.g. `http://localhost:3000` in development, your Netlify/Vercel URL in production).
  - `RESTAURANT_NAME`, `RESTAURANT_ADDRESS`, `RESTAURANT_PHONE`, `RESTAURANT_HOURS`.
  - `TAX_RATE` – e.g. `0.13` for **13% HST in Ontario**.

- **Stripe (optional)**

  - `STRIPE_SECRET_KEY` – your Stripe secret key.
  - `STRIPE_PUBLISHABLE_KEY` – your Stripe publishable key (used on the client if you extend the integration).
  - `STRIPE_SUCCESS_URL` – optional override for the checkout success redirect.
  - `STRIPE_CANCEL_URL` – optional override for the checkout cancel redirect.
  - `STRIPE_WEBHOOK_SECRET` – signing secret for Stripe webhooks (`checkout.session.completed`).

  If `STRIPE_SECRET_KEY` is **not set**, the “Pay with card (Stripe)” option will return an error from the API and a console warning will be shown. The **“Pay at pickup”** flow works without Stripe.

- **Email (Resend)**

  - `RESEND_API_KEY` – Resend API key.
  - `RESEND_DOMAIN` – sending domain (e.g. `yourdomain.com`).
  - `RESEND_FROM_EMAIL` – optional explicit sender (e.g. `onboarding@resend.dev` for testing).
  - `RESTAURANT_ORDER_EMAIL` – inbox that receives new order notifications.
  - `RESTAURANT_CONTACT_EMAIL` – inbox that receives contact form messages.

If `RESEND_API_KEY` is missing, the app will log a warning and simply skip sending emails (orders and contact forms will still be accepted).

You can swap Resend for another email provider later by editing `lib/email.ts`.

---

## 3. Directory structure

- `app/`
  - `layout.tsx` – global layout with navigation, footer, SEO, and sticky mobile order button.
  - `page.tsx` – **Home** page.
  - `menu/page.tsx` – **Menu** page with search and filters.
  - `order/page.tsx` – **Order Pickup** page (cart + form).
  - `order/confirmation/page.tsx` – confirmation page after ordering.
  - `location/page.tsx` – **Location & Hours**.
  - `about/page.tsx` – **About Us**.
  - `contact/page.tsx` – **Contact** page and form.
  - `api/order/route.ts` – “Pay at pickup” order creation, email, and in-memory storage.
  - `api/order/stripe/route.ts` – Stripe Checkout session creation.
  - `api/contact/route.ts` – contact form submission, sends email.
- `components/`
  - `layout/MainNav.tsx` – top navigation.
  - `layout/Footer.tsx` – footer with quick links and contact snippet.
  - `layout/StickyOrderButton.tsx` – fixed “Order Pickup” button on mobile.
  - `cart/cart-context.tsx` – shared cart context and helper hook.
  - `order/CartSummary.tsx` – cart list, quantities, notes, totals.
  - `order/PickupForm.tsx` – pickup details + payment toggle and submission logic.
  - `ui/Button.tsx` – small button component (used in multiple places).
- `data/menu.ts` – menu categories and ~30 realistic Vietnamese items (CAD).
- `lib/types.ts` – TypeScript types for menu, cart, and orders.
- `lib/validation.ts` – Zod schemas for server-side input validation.
- `lib/config.ts` – configuration and env variable helpers (name, tax rate, etc.).
- `lib/orderStore.ts` – **temporary in-memory** order store (for demo only).
- `lib/email.ts` – order and contact email helpers using Resend.
- `lib/stripe.ts` – Stripe client initialisation.
- `.env.example` – sample environment variables.

---

## 4. Order flow details

1. Guests browse the **Menu** (`/menu`) and use **“Add to cart”**.
2. The **cart** lives in a global React context (`components/cart/cart-context.tsx`) so the same cart is available on `/menu` and `/order`.
3. On the **Order Pickup** page (`/order`), guests:

   - Review items and quantities.
   - Add **notes per item** (e.g. “no cilantro”).
   - Enter **pickup details** (name, phone, optional email, pickup time).
   - Choose **Pay at pickup** or **Pay with card (Stripe)**.

4. When submitting:

   - **Pay at pickup** calls `POST /api/order`
     - Validates input with Zod (`lib/validation.ts`).
     - Calculates subtotal, tax, total (based on `TAX_RATE`).
     - Generates an order ID and stores it in `lib/orderStore.ts` (in-memory).
     - Sends an email to `RESTAURANT_ORDER_EMAIL` via Resend.
     - Redirects to `/order/confirmation?orderId=...`.

   - **Stripe Checkout** calls `POST /api/order/stripe`
     - Validates the same payload.
     - Calculates totals.
     - Creates a Stripe Checkout Session and redirects the browser to `session.url`.
     - Stores a pending in-memory order draft keyed by Stripe session ID.

5. Stripe webhook `POST /api/stripe/webhook`:
   - Verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`.
   - On `checkout.session.completed`, finalizes the pending order.
   - Stores order in memory and sends order email to restaurant.

6. The **confirmation page** shows basic order details, totals, and payment method when an in-memory order is found by ID.

> ⚠️ **Note about in-memory orders**: In serverless environments (like Netlify/Vercel), in-memory data may not persist between requests. For a production-ready system, replace `lib/orderStore.ts` with a real database (e.g. SQLite, Postgres, or a managed solution).

---

## 5. Deployment

### Deploy to Vercel

1. Push your project to GitHub/GitLab/Bitbucket.
2. Go to Vercel and create a new project from your repo.
3. In the **Environment Variables** section, copy the entries from `.env.example` (at minimum the restaurant info and tax rate).
4. Deploy.

Vercel automatically detects Next.js (App Router) and builds the app.

### Deploy to Netlify

1. Push your project to a Git provider (GitHub, GitLab, Bitbucket).
2. On Netlify, choose **Add new site → Import from Git**.
3. Use these settings:

   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

4. Add the same environment variables from `.env.example` in **Site settings → Environment**.
5. Netlify will build and deploy your app.

> Note: Netlify automatically handles Next.js App Router and API routes using its Next.js runtime. If you enable a persistent database later, make sure to follow Netlify’s docs for connecting to it from Next.js.

---

## 6. Editing menu items and categories

Menu data lives in `data/menu.ts`:

- `menuCategories` – list of categories (Pho, Bánh Mì, Rice Plates, etc.).
- `menuItems` – list of all dishes.

To edit the menu:

1. Open `data/menu.ts` in your editor.
2. Update or add to `menuCategories` (id, name, optional description).
3. Update or add to `menuItems`:

   - `id`: a unique string like `"pho-special"`.
   - `categoryId`: must match one of the category IDs.
   - `name`: English name (e.g. `"Classic Beef Pho"`).
   - `vietnameseName`: optional Vietnamese name (e.g. `"Phở Tái Chín"`).
   - `description`: short, clear description for guests.
   - `price`: numeric CAD price (e.g. `17.5`).
   - `tags`: optional dietary tags: `"spicy" | "vegetarian" | "vegan" | "gluten-free"`.
   - `isFeatured`: optional boolean to show item on the home page.

No additional configuration is required—the **Menu** and **Home** pages will automatically reflect your changes.

---

## 7. What to edit first (recommended steps)

1. **Set your restaurant info**

   - Copy `.env.example` to `.env.local`.
   - Fill in:
     - `RESTAURANT_NAME`
     - `RESTAURANT_ADDRESS`
     - `RESTAURANT_PHONE`
     - `RESTAURANT_HOURS`
   - Restart `npm run dev` if it’s already running.

2. **Customize the menu**

   - Open `data/menu.ts`.
   - Replace placeholder dishes with your own, keeping prices in CAD.
   - Adjust categories or add new items as needed.

3. **Adjust visual copy and story**

   - `app/page.tsx` – hero tagline, testimonial placeholders.
   - `app/about/page.tsx` – family story text and photo notes.
   - `app/location/page.tsx` – parking and transit notes.

4. **Configure email**

   - Create a Resend account (or another email provider).
   - Set `RESEND_API_KEY`, `RESEND_DOMAIN`, `RESTAURANT_ORDER_EMAIL`, and `RESTAURANT_CONTACT_EMAIL` in `.env.local`.
   - Test placing a “Pay at pickup” order and submitting the contact form.

5. **Configure Stripe (optional but recommended)**

   - Create a Stripe account and test keys.
   - Set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and (optionally) `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL`.
   - In development, make a small test payment with Stripe’s test cards.

6. **Deploy**

   - Choose Netlify or Vercel.
   - Add the same environment variables from `.env.local` to your hosting platform.
   - Trigger a deploy and test the full order flow on the live URL.

