import Stripe from "stripe";

// Lazily create a single Stripe instance on the server.

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  // In development it's fine if this is missing when you are only
  // testing the "Pay at pickup" flow.
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set. Stripe Checkout will be disabled.",
  );
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })
  : null;

