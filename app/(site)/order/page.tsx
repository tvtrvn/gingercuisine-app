import { getMenuItems } from "@/lib/menuStore";
import { OrderPageClient } from "./OrderPageClient";

// Read the merged menu per request so owner overrides/sold-out flags show
// immediately. Without this, Next prerenders the menu at build time (the DB
// read isn't a `fetch`, so it isn't auto-detected as dynamic).
export const dynamic = "force-dynamic";

// Server shell: read the merged menu (base + owner overrides + custom items)
// and hand it to the interactive client leaf.
export default async function OrderPage() {
  const items = await getMenuItems();
  return <OrderPageClient items={items} />;
}
