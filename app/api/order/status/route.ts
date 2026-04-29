import { getOrderById } from "@/lib/orderStore";
import { normalizeOrderCode } from "@/lib/orderCode";
import {
  getClientIp,
  orderStatusRateLimit,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { timingSafeEqualStr } from "@/lib/timingSafeString";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const rl = await orderStatusRateLimit.limit(`ip:${getClientIp(req)}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds(rl.reset)),
        },
      },
    );
  }

  const url = new URL(req.url);
  const idRaw = url.searchParams.get("orderId") ?? "";
  const token = url.searchParams.get("token") ?? "";

  const id = normalizeOrderCode(idRaw);

  if (!id || !token) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }

  const order = await getOrderById(id);
  if (
    !order ||
    !order.viewToken ||
    !timingSafeEqualStr(order.viewToken, token)
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    orderStatus: order.orderStatus,
    acknowledgedAt: order.acknowledgedAt ?? null,
    readyAt: order.readyAt ?? null,
    completedAt: order.completedAt ?? null,
    cancelledAt: order.cancelledAt ?? null,
  });
}
