"use client";

import { Order } from "@/lib/types";
import { useEffect } from "react";

interface Props {
  order: Order | null;
  onDismiss: () => void;
  onView: (order: Order) => void;
}

export function NewOrderToast({ order, onDismiss, onView }: Props) {
  useEffect(() => {
    if (!order) return;
    const id = setTimeout(onDismiss, 10_000);
    return () => clearTimeout(id);
  }, [order, onDismiss]);

  if (!order) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="pointer-events-auto fixed left-1/2 top-4 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-rose-300 bg-white p-4 shadow-2xl ring-2 ring-rose-200"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-rose-500 text-sm font-bold text-white">
          !
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-rose-900">New online order</p>
          <p className="mt-0.5 text-sm text-neutral-900">
            <span className="font-mono font-semibold">{order.id}</span> ·{" "}
            {order.pickupDetails.name}
          </p>
          <p className="text-xs text-neutral-600">
            {order.items.reduce((n, i) => n + i.quantity, 0)} items · Pickup:{" "}
            {order.pickupDetails.pickupTimeOption === "asap"
              ? "ASAP"
              : order.pickupDetails.pickupTime ?? "Later"}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onView(order)}
              className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              View order
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
