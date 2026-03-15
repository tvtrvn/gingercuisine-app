"use client";

import Link from "next/link";

export function StickyOrderButton() {
  // Mobile-only fixed button anchored near the bottom of the screen.
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 md:hidden">
      <Link
        href="/order"
        className="flex items-center justify-center rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label="Order pickup"
      >
        Order Pickup
      </Link>
    </div>
  );
}

