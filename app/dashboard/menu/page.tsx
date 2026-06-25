import { redirect } from "next/navigation";

import { MenuManager } from "@/components/dashboard/MenuManager";
import { RESTAURANT_NAME } from "@/lib/config";
import { getMenuItems } from "@/lib/menuStore";
import { hasDashboardSession } from "@/lib/requireDashboardSession";

export const dynamic = "force-dynamic";

export default async function DashboardMenuPage() {
  if (!(await hasDashboardSession())) {
    redirect("/dashboard/login");
  }

  const items = await getMenuItems();

  return <MenuManager restaurantName={RESTAURANT_NAME} initialItems={items} />;
}
