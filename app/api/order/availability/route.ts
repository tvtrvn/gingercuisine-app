import { getOrderingAvailability } from "@/lib/orderingStatus";
import {
  availabilityRateLimit,
  getClientIp,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public read of the current ordering availability. Used by the order page to
 * disable the submit button + show a banner when we can't accept orders.
 *
 * Safe to expose: it returns hours + a staff-supplied "reason" string, never
 * any operational details.
 *
 * Cost control (this is a public, unauthenticated endpoint polled every 30s by
 * every order-page visitor): a per-IP in-memory rate limit (no Redis) plus a
 * short server-side TTL memo so concurrent pollers collapse to ~1 DB read per
 * TTL window per instance, and a matching `max-age` so the browser/CDN can
 * serve the response without re-hitting us. The order-submit path
 * (`/api/order`) reads `getOrderingAvailability()` directly and is NOT cached —
 * it always re-checks against live truth.
 */
const CACHE_TTL_MS = 10_000;

let cached: {
  at: number;
  body: Awaited<ReturnType<typeof getOrderingAvailability>>;
} | null = null;

export async function GET(req: NextRequest) {
  const rl = await availabilityRateLimit.limit(`avail:${getClientIp(req)}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) },
      },
    );
  }

  try {
    const now = Date.now();
    if (!cached || now - cached.at >= CACHE_TTL_MS) {
      cached = { at: now, body: await getOrderingAvailability() };
    }
    return NextResponse.json(cached.body, {
      headers: { "Cache-Control": "public, max-age=10, s-maxage=10" },
    });
  } catch (error) {
    console.error("[/api/order/availability]", error);
    // Fail closed: if we can't read availability we surface "not accepting"
    // so customers see the degraded banner and don't compose orders that
    // /api/order would later reject. The submit-side enforcement still
    // exists as a backstop. Never cache a degraded response.
    return NextResponse.json(
      {
        accepting: false,
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
