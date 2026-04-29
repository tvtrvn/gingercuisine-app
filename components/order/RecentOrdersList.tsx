"use client";

import type { OrderStatus } from "@/lib/types";
import { listRecentOrders } from "@/lib/recentOrders";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function RecentOrdersList() {
  const [rows, setRows] = useState<
    { orderId: string; token: string; orderStatus: OrderStatus }[]
  >([]);

  useEffect(() => {
    const stored = listRecentOrders();
    if (stored.length === 0) return;

    let cancelled = false;

    async function run() {
      const results = await Promise.all(
        stored.map(async (s) => {
          try {
            const qs = new URLSearchParams({
              orderId: s.orderId,
              token: s.token,
            }).toString();
            const res = await fetch(`/api/order/status?${qs}`, {
              cache: "no-store",
            });
            if (!res.ok) return null;
            const data = (await res.json()) as {
              orderStatus: OrderStatus;
            };
            return {
              orderId: s.orderId,
              token: s.token,
              orderStatus: data.orderStatus,
            };
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;

      const open = results.filter((r): r is NonNullable<typeof r> => {
        if (!r) return false;
        return r.orderStatus !== "completed" && r.orderStatus !== "cancelled";
      });

      setRows(open);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-4">
      <h2 className="text-sm font-semibold text-emerald-950">
        Your recent orders on this device
      </h2>
      <p className="mt-1 text-xs text-emerald-800">
        Pick up where you left off —{" "}
        <span className="font-medium">does not transfer to another phone</span>
        .
      </p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li
            key={r.orderId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm"
          >
            <span>
              Order <span className="font-mono font-semibold">{r.orderId}</span>
              <span className="text-neutral-600">
                {" "}
                — {STATUS_LABEL[r.orderStatus] ?? r.orderStatus}
              </span>
            </span>
            <Link
              href={`/order/confirmation?orderId=${encodeURIComponent(r.orderId)}&token=${encodeURIComponent(r.token)}`}
              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              View status
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
