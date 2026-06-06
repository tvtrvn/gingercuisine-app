import { redirect } from "next/navigation";

import { MenuManager } from "@/components/dashboard/MenuManager";
import { RESTAURANT_NAME } from "@/lib/config";
import { getMenuAuditLog, getMenuItems } from "@/lib/menuStore";
import { hasDashboardSession } from "@/lib/requireDashboardSession";

export const dynamic = "force-dynamic";

export default async function DashboardMenuPage() {
  if (!(await hasDashboardSession())) {
    redirect("/dashboard/login");
  }

  const [items, audit] = await Promise.all([
    getMenuItems(),
    getMenuAuditLog(),
  ]);

  return (
    <MenuManager
      restaurantName={RESTAURANT_NAME}
      initialItems={items}
      initialAudit={audit.slice(-50).reverse()}
    />
  );
}
