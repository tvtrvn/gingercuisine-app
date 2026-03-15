// Basic configuration values that are easy to change later.

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

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const ORDER_NOTIFICATION_EMAIL =
  process.env.RESTAURANT_ORDER_EMAIL || "orders@example.com";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_RESTAURANT_CONTACT_EMAIL ||
  process.env.RESTAURANT_CONTACT_EMAIL ||
  "contact@example.com";

