import { sendOrderEmail } from "@/lib/email";
import { createOrder } from "@/lib/orderStore";
import { PricingError, priceCart } from "@/lib/pricing";
import {
  getClientIp,
  orderRateLimit,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/requireSameOrigin";
import { orderRequestSchema } from "@/lib/validation";
import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Build a public order code: timestamp prefix (sortable, readable) plus a
 * short random suffix to make codes effectively unguessable AND eliminate
 * the rare collision when two orders land in the same millisecond.
 */
function generateOrderCode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString("hex").toUpperCase(); // 4 hex chars
  return `GC-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await orderRateLimit.limit(`ip:${getClientIp(req)}`);
  if (!rl.success) {
    return NextResponse.json(
      {
        error:
          "You're placing orders too quickly. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds(rl.reset)),
        },
      },
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

    const { items: selections, pickupDetails } = parsed.data;

    let priced;
    try {
      priced = priceCart(selections);
    } catch (err) {
      if (err instanceof PricingError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const orderCode = generateOrderCode();

    const order = await createOrder({
      orderCode,
      items: priced.items,
      pickupDetails,
      subtotal: priced.subtotal,
      tax: priced.tax,
      total: priced.total,
    });

    sendOrderEmail(order).catch((err) =>
      console.error("[/api/order] email failed:", err),
    );

    return NextResponse.json(
      {
        orderId: order.id,
        viewToken: order.viewToken,
        totals: order.totals,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[/api/order] error:", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the order." },
      { status: 500 },
    );
  }
}
