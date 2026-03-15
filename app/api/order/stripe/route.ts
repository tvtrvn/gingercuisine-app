import { CURRENCY, SITE_URL, TAX_RATE } from "@/lib/config";
import { stripe } from "@/lib/stripe";
import { savePendingStripeOrder } from "@/lib/stripeOrderStore";
import { Order } from "@/lib/types";
import { orderRequestSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const json = await req.json();
    const parsed = orderRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { items, pickupDetails } = parsed.data;
    const subtotal = items.reduce(
      (sum, item) => sum + (item.unitPrice ?? item.price) * item.quantity,
      0,
    );
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const orderId = `GC-${Date.now().toString(36).toUpperCase()}`;

    const successBaseUrl =
      process.env.STRIPE_SUCCESS_URL || `${SITE_URL}/order/confirmation`;
    const successUrl = `${successBaseUrl}${successBaseUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}&orderId=${encodeURIComponent(orderId)}`;
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL || `${SITE_URL}/order?cancelled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: CURRENCY.toLowerCase(),
          unit_amount: Math.round((item.unitPrice ?? item.price) * 100),
          product_data: {
            name: item.name,
          },
        },
      })),
      discounts: [],
      automatic_tax: { enabled: false },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: orderId,
        pickup_name: pickupDetails.name,
        pickup_phone: pickupDetails.phone,
        pickup_email: pickupDetails.email ?? "",
        pickup_time_option: pickupDetails.pickupTimeOption,
        pickup_time: pickupDetails.pickupTime ?? "",
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      },
    });

    // Save pending order so webhook can finalize and email restaurant.
    const pendingOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      items,
      pickupDetails,
      paymentMethod: "stripe",
      status: "new",
      totals: { subtotal, tax, total },
    };
    await savePendingStripeOrder(session.id, pendingOrder);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while creating the Stripe session." },
      { status: 500 },
    );
  }
}

