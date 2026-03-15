import { sendOrderEmail } from "@/lib/email";
import { addOrder, getOrderById } from "@/lib/orderStore";
import { stripe } from "@/lib/stripe";
import { consumePendingStripeOrder } from "@/lib/stripeOrderStore";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured on the server." },
      { status: 500 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessionId = session.id;
      const pendingOrder = await consumePendingStripeOrder(sessionId);
      const metadataOrderId = session.metadata?.order_id;
      const orderId = pendingOrder?.id || metadataOrderId;

      if (pendingOrder) {
        // Avoid duplicate insert/send if Stripe retries the same webhook.
        if (!(await getOrderById(pendingOrder.id))) {
          await addOrder(pendingOrder, sessionId);
          await sendOrderEmail(pendingOrder);
        }
      } else {
        console.warn(
          `[stripe webhook] No pending in-memory order found for session ${sessionId} (order id: ${orderId ?? "unknown"}).`,
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[stripe webhook] processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}

