import { getOrderById, updateOrder } from "@/lib/orderStore";
import {
  dashboardRateLimitKey,
  dashboardReadRateLimit,
  dashboardWriteRateLimit,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { requireDashboardApi } from "@/lib/requireDashboardSession";
import { isSameOrigin } from "@/lib/requireSameOrigin";
import { orderUpdateSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const rl = await dashboardReadRateLimit.limit(await dashboardRateLimitKey(req));
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) },
      },
    );
  }

  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const unauthorized = await requireDashboardApi();
  if (unauthorized) return unauthorized;

  const rl = await dashboardWriteRateLimit.limit(
    await dashboardRateLimitKey(req),
  );
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many updates in a short time. Slow down a bit." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds(rl.reset)),
        },
      },
    );
  }

  const { orderId } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = orderUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateOrder(orderId, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { error: "Order not found or update failed." },
      { status: 404 },
    );
  }
  return NextResponse.json({ order: updated });
}
