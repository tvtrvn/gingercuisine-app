import { createHash } from "node:crypto";
import { DASHBOARD_COOKIE_NAME } from "@/lib/dashboardAuth";
import { searchOrders } from "@/lib/orderStore";
import {
  dashboardSearchRateLimit,
  getClientIp,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { requireDashboardApi } from "@/lib/requireDashboardSession";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_LIMIT = 50;
const MAX_QUERY_LEN = 60;

export async function GET(req: NextRequest) {
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  // Rate-limit per session to keep search scans cheap.
  const cookieStore = await cookies();
  const session = cookieStore.get(DASHBOARD_COOKIE_NAME)?.value ?? "";
  const key = session
    ? `sess:${createHash("sha256").update(session).digest("hex").slice(0, 32)}`
    : `ip:${getClientIp(req)}`;
  const rl = await dashboardSearchRateLimit.limit(key);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) },
      },
    );
  }

  const { searchParams } = new URL(req.url);
  const rawQ = searchParams.get("q") ?? "";
  const q = rawQ.slice(0, MAX_QUERY_LEN);
  const limitParam = Number(searchParams.get("limit") ?? MAX_LIMIT);
  const limit = Math.min(
    Number.isFinite(limitParam) && limitParam > 0 ? limitParam : MAX_LIMIT,
    MAX_LIMIT,
  );

  if (q.trim().length < 2) {
    return NextResponse.json(
      { orders: [], query: q, note: "Type at least 2 characters to search." },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const orders = await searchOrders(q, limit);
    return NextResponse.json(
      {
        orders,
        query: q,
        serverTime: new Date().toISOString(),
        truncated: orders.length >= limit,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[/api/dashboard/orders/search GET]", error);
    return NextResponse.json(
      { error: "Search failed." },
      { status: 500 },
    );
  }
}
