import { listOrders } from "@/lib/orderStore";
import { requireDashboardApi } from "@/lib/requireDashboardSession";
import { OrderStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALL_STATUSES: OrderStatus[] = [
  "new",
  "acknowledged",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

export async function GET(req: NextRequest) {
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "all"; // "active" | "all"
  const limit = Number(searchParams.get("limit") ?? "200");

  const statusesParam = searchParams.get("statuses");
  const statuses = statusesParam
    ? (statusesParam
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is OrderStatus =>
          (ALL_STATUSES as string[]).includes(s),
        ))
    : undefined;

  try {
    const orders = await listOrders({
      limit: Number.isFinite(limit) ? limit : 200,
      activeOnly: scope === "active",
      statuses,
    });
    return NextResponse.json(
      { orders, serverTime: new Date().toISOString() },
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
