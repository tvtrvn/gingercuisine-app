import { sendOrderEmail } from "@/lib/email";
import { generateOrderCode } from "@/lib/orderCode";
import { getOrderingAvailability } from "@/lib/orderingStatus";
import { getMenuItems } from "@/lib/menuStore";
import { createOrder } from "@/lib/orderStore";
import { PricingError, priceCart } from "@/lib/pricing";
import {
  getClientIp,
  orderRateLimit,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/requireSameOrigin";
import { orderRequestSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

  // Authoritative ordering gate: closed hours AND the staff pause toggle.
  // Doing this before parsing/pricing keeps closed-time POSTs cheap, and
  // before the same-origin error (which already ran above) ensures the
  // browser sees a clear 503 + message so we can show it inline. We still
  // rely on this check even though the client also has a banner — never
  // trust the client to enforce business hours.
  const availability = await getOrderingAvailability();
  if (!availability.accepting) {
    return NextResponse.json(
      {
        error:
          availability.message ??
          "We're not accepting online orders right now.",
        reason: availability.reason ?? "closed",
        availability,
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
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
      priced = priceCart(selections, await getMenuItems());
    } catch (err) {
      if (err instanceof PricingError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    let order: Awaited<ReturnType<typeof createOrder>> | undefined;
    let lastDup: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      const orderCode = generateOrderCode();
      try {
        order = await createOrder({
          orderCode,
          items: priced.items,
          pickupDetails,
          subtotal: priced.subtotal,
          tax: priced.tax,
          total: priced.total,
        });
        break;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          lastDup = err;
          continue;
        }
        throw err;
      }
    }

    if (!order) {
      console.error("[/api/order] orderCode collision after retries:", lastDup);
      return NextResponse.json(
        { error: "Could not assign an order number. Please try again." },
        { status: 503 },
      );
    }

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
