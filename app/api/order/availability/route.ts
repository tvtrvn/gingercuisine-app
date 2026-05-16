import { getOrderingAvailability } from "@/lib/orderingStatus";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public read of the current ordering availability. Used by the order page to
 * disable the submit button + show a banner when we can't accept orders.
 *
 * Safe to expose: it returns hours + a staff-supplied "reason" string, never
 * any operational details. No rate limiting because it's cached for 15s
 * client-side, and the underlying DB read is a single document by primary
 * key. If you need to publish a sensitive pause reason, redact it before
 * calling `setOrderingPause`.
 */
export async function GET() {
  try {
    const availability = await getOrderingAvailability();
    return NextResponse.json(availability, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[/api/order/availability]", error);
    // Fail open so a DB hiccup doesn't block the whole storefront. The
    // server-side enforcement in /api/order will still bounce orders that
    // arrive while we're truly closed.
    return NextResponse.json(
      {
        accepting: true,
        staffPaused: false,
        hours: null,
        serverTime: new Date().toISOString(),
        degraded: true,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  }
}
