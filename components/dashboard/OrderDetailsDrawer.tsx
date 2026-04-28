"use client";

import { CURRENCY } from "@/lib/config";
import { Order, OrderStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useEffect } from "react";
import { OrderStatusBadge } from "./StatusBadge";

interface Props {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, next: OrderStatus) => void;
  onCancelOrder: (orderId: string) => void;
}

const ACTION_STATUSES: { status: OrderStatus; label: string }[] = [
  { status: "acknowledged", label: "Acknowledge" },
  { status: "ready", label: "Ready" },
  { status: "completed", label: "Completed" },
];

export function OrderDetailsDrawer({
  order,
  onClose,
  onUpdateStatus,
  onCancelOrder,
}: Props) {
  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!order) return null;

  const pickupLabel =
    order.pickupDetails.pickupTimeOption === "asap"
      ? "ASAP"
      : order.pickupDetails.pickupTime ?? "Later today";

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-drawer-title"
    >
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="flex-1 bg-neutral-900/50"
      />
      <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="order-drawer-title"
                className="font-mono text-base font-semibold text-neutral-900"
              >
                {order.id}
              </h2>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {order.pickupDetails.name}
            </p>
            <p className="text-sm text-neutral-700">
              {order.pickupDetails.phone}
              {order.pickupDetails.email
                ? ` · ${order.pickupDetails.email}`
                : ""}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              Pickup: <span className="font-semibold">{pickupLabel}</span>
            </p>
            <p className="text-xs text-neutral-500">
              Placed: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Close
          </button>
        </header>

        <section className="space-y-4 px-5 py-5">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Items</h3>
            <ul className="mt-2 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
              {order.items.map((item) => {
                const unitPrice = item.unitPrice ?? item.price;
                return (
                  <li key={item.id} className="space-y-1 px-3 py-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold text-neutral-900">
                        {item.quantity} × {item.name}
                      </p>
                      <p className="font-semibold text-neutral-900">
                        {formatCurrency(unitPrice * item.quantity, CURRENCY)}
                      </p>
                    </div>
                    {item.selectedSize && (
                      <p className="text-xs text-neutral-700">
                        Size:{" "}
                        <span className="font-medium">
                          {item.selectedSize.label}
                        </span>
                      </p>
                    )}
                    {item.selectedFlavor && (
                      <p className="text-xs text-neutral-700">
                        Flavor:{" "}
                        <span className="font-medium">
                          {item.selectedFlavor.name}
                        </span>
                      </p>
                    )}
                    {item.selectedAddons &&
                      item.selectedAddons.length > 0 && (
                        <p className="text-xs text-neutral-700">
                          Add-ons:{" "}
                          <span className="font-medium">
                            {item.selectedAddons
                              .map(
                                (a) =>
                                  `${a.name} (+${formatCurrency(a.price)})`,
                              )
                              .join(", ")}
                          </span>
                        </p>
                      )}
                    {item.notes && (
                      <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">
                        Note: {item.notes}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span>{formatCurrency(order.totals.subtotal, CURRENCY)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Tax</span>
              <span>{formatCurrency(order.totals.tax, CURRENCY)}</span>
            </div>
            <div className="mt-1 flex justify-between text-lg font-semibold text-neutral-900">
              <span>Total</span>
              <span>{formatCurrency(order.totals.total, CURRENCY)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2 text-xs text-neutral-600">
              <span>Payment method</span>
              <span className="font-semibold text-neutral-800">
                Pay in person · Unpaid
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Update status
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACTION_STATUSES.map((a) => (
                <button
                  key={a.status}
                  type="button"
                  onClick={() => onUpdateStatus(order.id, a.status)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                    order.orderStatus === a.status
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {order.orderStatus !== "cancelled" &&
            order.orderStatus !== "completed" && (
              <div className="border-t border-neutral-200 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Cancel order ${order.id}?`)) {
                      onCancelOrder(order.id);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Cancel order
                </button>
              </div>
            )}
        </section>
      </div>
    </div>
  );
}
