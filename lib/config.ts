// Basic configuration values that are easy to change later.

import type { CountryCode } from "libphonenumber-js";

export const RESTAURANT_NAME = process.env.RESTAURANT_NAME || "(RESTAURANT_NAME)";
export const RESTAURANT_ADDRESS = process.env.RESTAURANT_ADDRESS || "(ADDRESS)";
export const RESTAURANT_PHONE =
  process.env.NEXT_PUBLIC_RESTAURANT_PHONE ||
  process.env.RESTAURANT_PHONE ||
  "(PHONE)";
export const RESTAURANT_HOURS = process.env.RESTAURANT_HOURS || "(HOURS)";

export const CURRENCY = "CAD";

// Example: 13% HST in Ontario -> 0.13
export const TAX_RATE = Number(process.env.TAX_RATE ?? "0.13");

// Dashboard polling interval (ms). Can be tuned per-deployment.
export const DASHBOARD_POLL_INTERVAL_MS = Number(
  process.env.DASHBOARD_POLL_INTERVAL_MS ?? "4000",
);

// How far back the live dashboard board fetches completed/cancelled orders.
// Active orders (new/acknowledged/ready) are ALWAYS shown regardless of age;
// this window only clips the history of closed orders so the board stays fast.
// Older orders remain reachable via the search bar.
export const DASHBOARD_HISTORY_WINDOW_HOURS = Math.max(
  1,
  Number(process.env.DASHBOARD_HISTORY_WINDOW_HOURS ?? "72"),
);

// Messaging shown to customers (single source of truth).
export const PRICES_NOTICE = "Prices subject to change without notice.";
export const PAY_IN_PERSON_NOTICE =
  "Payment is collected in person at the restaurant when you pick up your order.";
export const PICKUP_READY_NOTICE =
  "Your order should be ready in 10–15 minutes.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const ORDER_NOTIFICATION_EMAIL =
  process.env.RESTAURANT_ORDER_EMAIL || "orders@example.com";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_RESTAURANT_CONTACT_EMAIL ||
  process.env.RESTAURANT_CONTACT_EMAIL ||
  "contact@example.com";

/** Passed to libphonenumber-js for parsing/formatting (+ validation). Examples: `"CA"` (default), `"US"`. */
export const PHONE_DEFAULT_REGION = (process.env
  .NEXT_PUBLIC_PHONE_DEFAULT_REGION ?? "CA") as CountryCode;
