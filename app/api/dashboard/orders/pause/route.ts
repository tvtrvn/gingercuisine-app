import { getOrderingAvailability } from "@/lib/orderingStatus";
import {
  dashboardRateLimitKey,
  dashboardReadRateLimit,
  dashboardWriteRateLimit,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { requireDashboardApi } from "@/lib/requireDashboardSession";
import { isSameOrigin } from "@/lib/requireSameOrigin";
import { setOrderingPause } from "@/lib/restaurantSettings";
import { orderingPauseUpdateSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — current ordering availability (mirrors `/api/order/availability`
 * but is auth-gated so we can include any future staff-only fields here
 * without leaking them publicly).
 *
 * Two dashboard components poll this every 30s, so we add an in-memory read
 * cap and a short TTL memo (invalidated on POST) to collapse the redundant
 * reads — the same cost discipline applied to the public availability route.
 */
const PAUSE_CACHE_TTL_MS = 10_000;

let pauseCached: {
  at: number;
  body: Awaited<ReturnType<typeof getOrderingAvailability>>;
} | null = null;

export async function GET(req: NextRequest) {
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const rl = await dashboardReadRateLimit.limit(await dashboardRateLimitKey(req));
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
    if (!pauseCached || now - pauseCached.at >= PAUSE_CACHE_TTL_MS) {
      pauseCached = { at: now, body: await getOrderingAvailability() };
    }
    return NextResponse.json(pauseCached.body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[/api/dashboard/orders/pause GET]", error);
    return NextResponse.json(
      { error: "Failed to load ordering availability." },
      { status: 500 },
    );
  }
}

/**
 * POST — flip the pause toggle. Body: `{ paused: boolean, reason?: string }`.
 * Returns the new availability snapshot so the dashboard can update its UI
 * in one round-trip.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  // Same rate-limit bucket as other dashboard writes — toggling pause
  // counts as a normal staff action.
  const rl = await dashboardWriteRateLimit.limit(
    await dashboardRateLimitKey(req),
  );
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many updates in a short time. Slow down a bit." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) },
      },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = orderingPauseUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await setOrderingPause(parsed.data);
    pauseCached = null; // staff just changed it — don't serve a stale memo
    const availability = await getOrderingAvailability();
    return NextResponse.json(availability, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[/api/dashboard/orders/pause POST]", error);
    return NextResponse.json(
      { error: "Failed to update ordering availability." },
      { status: 500 },
    );
  }
}
