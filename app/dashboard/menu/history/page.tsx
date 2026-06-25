import { redirect } from "next/navigation";

import { MenuHistory } from "@/components/dashboard/MenuHistory";
import { RESTAURANT_NAME } from "@/lib/config";
import { getMenuAuditLog } from "@/lib/menuStore";
import { hasDashboardSession } from "@/lib/requireDashboardSession";

export const dynamic = "force-dynamic";

export default async function DashboardMenuHistoryPage() {
  if (!(await hasDashboardSession())) {
    redirect("/dashboard/login");
  }

  const audit = await getMenuAuditLog();

  return (
    <MenuHistory restaurantName={RESTAURANT_NAME} entries={audit.slice().reverse()} />
  );
}
