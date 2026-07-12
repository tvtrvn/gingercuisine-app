"use client";

import { useCart } from "@/components/cart/cart-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function StickyOrderButton() {
  const { itemCount } = useCart();
  const pathname = usePathname();

  // Redundant on /order (the page IS the order flow — with an empty cart the
  // bar would sit on the first card's size chips) and on /order/confirmation
  // (the customer just ordered). Hide it on the whole /order subtree.
  if (pathname.startsWith("/order")) return null;
  if (itemCount > 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 md:hidden">
      <Link
        href="/order"
        className="flex min-h-12 items-center justify-center rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-colors duration-200 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        aria-label="Order pickup"
      >
        Order Pickup
      </Link>
    </div>
  );
}
