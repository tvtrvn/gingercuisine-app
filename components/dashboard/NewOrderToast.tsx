"use client";

import { Button } from "@/components/ui/Button";
import { Order } from "@/lib/types";
import { Bell } from "lucide-react";
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
      className="pointer-events-auto fixed inset-x-4 top-4 z-[60] flex justify-center sm:inset-x-8"
    >
      <div className="w-full max-w-md animate-toast-slide-in rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl ring-2 ring-blue-100/80">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
            <Bell className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-blue-950">New online order</p>
            <p className="mt-0.5 truncate text-sm text-neutral-900">
              <span className="font-mono font-semibold">{order.id}</span> ·{" "}
              {order.pickupDetails.name}
            </p>
            <p className="text-xs text-neutral-600">
              {order.items.reduce((n, i) => n + i.quantity, 0)} items · Pickup:{" "}
              {order.pickupDetails.pickupTimeOption === "asap"
                ? "ASAP"
                : order.pickupDetails.pickupTime ?? "Later"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onView(order)}
                className="bg-neutral-900 hover:bg-neutral-800"
              >
                View order
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
