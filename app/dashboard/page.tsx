import { OrderBoard } from "@/components/dashboard/OrderBoard";
import {
  DASHBOARD_HISTORY_WINDOW_HOURS,
  DASHBOARD_POLL_INTERVAL_MS,
  RESTAURANT_NAME,
} from "@/lib/config";
import { getOrderingAvailability } from "@/lib/orderingStatus";
import { listRecentAndActive } from "@/lib/orderStore";
import { hasDashboardSession } from "@/lib/requireDashboardSession";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  if (!(await hasDashboardSession())) {
    redirect("/dashboard/login");
  }

  // Run both reads in parallel — the dashboard load is the slowest page in
  // the app and these two queries are independent. Availability is a single
  // doc lookup so it's effectively free.
  const [orders, availability] = await Promise.all([
    listRecentAndActive({
      windowHours: DASHBOARD_HISTORY_WINDOW_HOURS,
      limit: 500,
    }),
    getOrderingAvailability(),
  ]);

  return (
    <OrderBoard
      initialOrders={orders}
      pollIntervalMs={DASHBOARD_POLL_INTERVAL_MS}
      historyWindowHours={DASHBOARD_HISTORY_WINDOW_HOURS}
      restaurantName={RESTAURANT_NAME}
      initialAvailability={{
        accepting: availability.accepting,
        reason: availability.reason,
        message: availability.message,
        staffPaused: availability.staffPaused,
        staffPauseReason: availability.staffPauseReason,
        staffPausedAt: availability.staffPausedAt,
      }}
    />
  );
}
