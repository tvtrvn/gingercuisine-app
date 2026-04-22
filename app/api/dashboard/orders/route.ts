import { DASHBOARD_HISTORY_WINDOW_HOURS } from "@/lib/config";
import { listRecentAndActive } from "@/lib/orderStore";
import { requireDashboardApi } from "@/lib/requireDashboardSession";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_LIMIT = 500;
const MAX_WINDOW_HOURS = 24 * 14; // 2 weeks, hard ceiling

function parseWindowHours(raw: string | null): number {
  if (!raw) return DASHBOARD_HISTORY_WINDOW_HOURS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DASHBOARD_HISTORY_WINDOW_HOURS;
  return Math.min(n, MAX_WINDOW_HOURS);
}

function parseLimit(raw: string | null): number {
  if (!raw) return MAX_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return MAX_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const windowHours = parseWindowHours(searchParams.get("windowHours"));
  const limit = parseLimit(searchParams.get("limit"));

  try {
    const orders = await listRecentAndActive({ windowHours, limit });
    return NextResponse.json(
      {
        orders,
        serverTime: new Date().toISOString(),
        windowHours,
        limit,
        truncated: orders.length >= limit,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[/api/dashboard/orders GET]", error);
    return NextResponse.json(
      { error: "Failed to load orders." },
      { status: 500 },
    );
  }
}
