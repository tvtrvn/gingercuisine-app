import { Resend } from "resend";
import {
  CONTACT_EMAIL,
  ORDER_NOTIFICATION_EMAIL,
  PRICES_NOTICE,
  RESTAURANT_NAME,
} from "./config";
import { Order } from "./types";
import { ContactFormInput } from "./validation";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL ||
  (process.env.RESEND_DOMAIN
    ? `orders@${process.env.RESEND_DOMAIN}`
    : "onboarding@resend.dev");
const resendContactFromEmail =
  process.env.RESEND_FROM_EMAIL ||
  (process.env.RESEND_DOMAIN
    ? `contact@${process.env.RESEND_DOMAIN}`
    : "onboarding@resend.dev");

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Strip CR/LF so user-supplied strings can't break out of a header line
// (e.g. inject a fake `Subject:` or extra `To:` via Resend) and collapse
// whitespace. Use on anything that ends up in a single-line context.
function sanitizeOneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

// Normalize line endings for multi-line body fields. We keep newlines, but
// never raw CR which can confuse downstream parsers.
function sanitizeMultiLine(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

// Sends an email to the restaurant when a new order is placed.
export async function sendOrderEmail(order: Order) {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY is not set. Order emails will not be sent.",
    );
    return;
  }

  if (!ORDER_NOTIFICATION_EMAIL) {
    console.warn(
      "[email] RESTAURANT_ORDER_EMAIL not set — skipping order email",
    );
    return;
  }

  const itemsText = order.items
    .map((item) => {
      const unitPrice = item.unitPrice ?? item.price;
      const flavorText = item.selectedFlavor
        ? ` [Flavor: ${sanitizeOneLine(item.selectedFlavor.name)}]`
        : "";
      const sizeText = item.selectedSize
        ? ` [Size: ${sanitizeOneLine(item.selectedSize.label)}]`
        : "";
      const addonsText =
        item.selectedAddons && item.selectedAddons.length > 0
          ? ` [Add-ons: ${item.selectedAddons
              .map(
                (addon) =>
                  `${sanitizeOneLine(addon.name)} (+$${addon.price.toFixed(2)})`,
              )
              .join(", ")}]`
          : "";
      const notesText = item.notes
        ? ` [Notes: ${sanitizeOneLine(item.notes)}]`
        : "";
      return `- ${item.quantity} x ${sanitizeOneLine(item.name)} ($${unitPrice.toFixed(2)})${flavorText}${sizeText}${addonsText}${notesText}`;
    })
    .join("\n");

  const body = [
    `New online pickup order for ${RESTAURANT_NAME}`,
    ``,
    `Order ID: ${order.id}`,
    `Placed: ${order.createdAt}`,
    ``,
    `Customer: ${sanitizeOneLine(order.pickupDetails.name)}`,
    `Phone: ${sanitizeOneLine(order.pickupDetails.phone)}`,
    order.pickupDetails.email
      ? `Email: ${sanitizeOneLine(order.pickupDetails.email)}`
      : undefined,
    `Pickup: ${order.pickupDetails.pickupTimeOption === "asap" ? "ASAP" : sanitizeOneLine(order.pickupDetails.pickupTime || "later today")}`,
    ``,
    `Items:`,
    itemsText,
    ``,
    `Subtotal: $${order.totals.subtotal.toFixed(2)}`,
    `Tax: $${order.totals.tax.toFixed(2)}`,
    `Total: $${order.totals.total.toFixed(2)}`,
    ``,
    `Payment: Pay in person at pickup (unpaid)`,
    ``,
    `Note: ${PRICES_NOTICE}`,
  ]
    .filter(Boolean)
    .join("\n");

  await resend.emails.send({
    from: `${RESTAURANT_NAME} Orders <${resendFromEmail}>`,
    to: ORDER_NOTIFICATION_EMAIL,
    subject: `New online order: ${order.id}`,
    text: body,
  });
}

// Sends a copy of the contact form to the restaurant.
export async function sendContactEmail(input: ContactFormInput) {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY is not set. Contact emails will not be sent.",
    );
    return;
  }

  if (!CONTACT_EMAIL) {
    console.warn(
      "[email] RESTAURANT_CONTACT_EMAIL not set — skipping contact email",
    );
    return;
  }

  const safeName = sanitizeOneLine(input.name);
  const body = [
    `New contact form submission for ${RESTAURANT_NAME}`,
    ``,
    `Name: ${safeName}`,
    `Email: ${sanitizeOneLine(input.email)}`,
    ``,
    `Message:`,
    sanitizeMultiLine(input.message),
  ].join("\n");

  await resend.emails.send({
    from: `${RESTAURANT_NAME} Website <${resendContactFromEmail}>`,
    to: CONTACT_EMAIL,
    subject: `New contact form message from ${safeName}`,
    text: body,
  });
}
