import { OrderBoard } from "@/components/dashboard/OrderBoard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DASHBOARD_POLL_INTERVAL_MS, RESTAURANT_NAME } from "@/lib/config";
import { listOrders } from "@/lib/orderStore";
import { hasDashboardSession } from "@/lib/requireDashboardSession";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  if (!(await hasDashboardSession())) {
    redirect("/dashboard/login");
  }

  const orders = await listOrders({ limit: 200 });

  return (
    <>
      <DashboardHeader restaurantName={RESTAURANT_NAME} />
      <div className="px-4 py-4 md:px-6 md:py-6">
        <OrderBoard
          initialOrders={orders}
          pollIntervalMs={DASHBOARD_POLL_INTERVAL_MS}
        />
      </div>
    </>
  );
}
