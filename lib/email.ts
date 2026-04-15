import { Resend } from "resend";
import {
    CONTACT_EMAIL,
    ORDER_NOTIFICATION_EMAIL,
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

// Sends an email to the restaurant when a new order is placed.
export async function sendOrderEmail(order: Order) {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY is not set. Order emails will not be sent.",
    );
    return;
  }

  const itemsText = order.items
    .map(
      (item) => {
        const unitPrice = item.unitPrice ?? item.price;
        const flavorText = item.selectedFlavor ? ` [Flavor: ${item.selectedFlavor.name}]` : "";
        const sizeText = item.selectedSize ? ` [Size: ${item.selectedSize.label}]` : "";
        const addonsText =
          item.selectedAddons && item.selectedAddons.length > 0
            ? ` [Add-ons: ${item.selectedAddons
                .map((addon) => `${addon.name} (+$${addon.price.toFixed(2)})`)
                .join(", ")}]`
            : "";
        const notesText = item.notes ? ` [Notes: ${item.notes}]` : "";
        return `- ${item.quantity} x ${item.name} ($${unitPrice.toFixed(2)})${flavorText}${sizeText}${addonsText}${notesText}`;
      },
    )
    .join("\n");

  const body = [
    `New pickup order for ${RESTAURANT_NAME}`,
    ``,
    `Order ID: ${order.id}`,
    `Created At: ${order.createdAt}`,
    ``,
    `Customer: ${order.pickupDetails.name}`,
    `Phone: ${order.pickupDetails.phone}`,
    order.pickupDetails.email
      ? `Email: ${order.pickupDetails.email}`
      : undefined,
    `Pickup Time Option: ${order.pickupDetails.pickupTimeOption}`,
    order.pickupDetails.pickupTime
      ? `Requested Time: ${order.pickupDetails.pickupTime}`
      : undefined,
    ``,
    `Items:`,
    itemsText,
    ``,
    `Subtotal: $${order.totals.subtotal.toFixed(2)}`,
    `Tax: $${order.totals.tax.toFixed(2)}`,
    `Total: $${order.totals.total.toFixed(2)}`,
    ``,
    `Payment Method: ${order.paymentMethod === "stripe" ? "Stripe" : "Pay at pickup"}`,
  ]
    .filter(Boolean)
    .join("\n");

  await resend.emails.send({
    from: `${RESTAURANT_NAME} Orders <${resendFromEmail}>`,
    to: ORDER_NOTIFICATION_EMAIL,
    subject: `New pickup order: ${order.id}`,
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

  const body = [
    `New contact form submission for ${RESTAURANT_NAME}`,
    ``,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    ``,
    `Message:`,
    input.message,
  ].join("\n");

  await resend.emails.send({
    from: `${RESTAURANT_NAME} Website <${resendContactFromEmail}>`,
    to: CONTACT_EMAIL,
    subject: `New contact form message from ${input.name}`,
    text: body,
  });
}

