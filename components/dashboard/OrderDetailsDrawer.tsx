"use client";

import { Button } from "@/components/ui/Button";
import { CURRENCY } from "@/lib/config";
import { Order, OrderStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Check, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { OrderStatusBadge } from "./StatusBadge";

interface Props {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, next: OrderStatus) => void;
  onCancelOrder: (orderId: string) => void;
}

const WORKFLOW_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "acknowledged", label: "Acknowledge" },
  { status: "ready", label: "Ready" },
  { status: "completed", label: "Completed" },
];

const UNDO_TARGET: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  acknowledged: { status: "new", label: "New" },
  ready: { status: "acknowledged", label: "Acknowledged" },
  completed: { status: "ready", label: "Ready" },
};

function statusRank(status: OrderStatus): number {
  switch (status) {
    case "new":
      return 0;
    case "acknowledged":
      return 1;
    case "ready":
      return 2;
    case "completed":
      return 3;
    default:
      return -1;
  }
}

function OrderDetailsPanel({
  order,
  onClose,
  onUpdateStatus,
  onCancelOrder,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, next: OrderStatus) => void;
  onCancelOrder: (orderId: string) => void;
}) {
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const pickupLabel =
    order.pickupDetails.pickupTimeOption === "asap"
      ? "ASAP"
      : order.pickupDetails.pickupTime ?? "Later today";

  const rankCurrent = statusRank(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";
  const undoTarget = UNDO_TARGET[order.orderStatus];

  return (
    <>
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="flex-1 bg-neutral-900/50 transition-opacity duration-200"
      />
      <div
        className="animate-drawer-in flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
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
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>

        <section className="space-y-4 px-5 py-5">
          {!isCancelled && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Update status
              </h3>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const targetRank = statusRank(step.status);
                  const done = rankCurrent >= targetRank;
                  const isNext =
                    !done &&
                    (idx === 0 ||
                      rankCurrent >=
                        statusRank(WORKFLOW_STEPS[idx - 1]!.status));

                  return (
                    <button
                      key={step.status}
                      type="button"
                      onClick={() => onUpdateStatus(order.id, step.status)}
                      className={cn(
                        "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-bold uppercase leading-tight transition-colors duration-200 sm:text-[11px]",
                        done
                          ? "bg-brand-600 text-white shadow-sm"
                          : isNext
                            ? "bg-white text-brand-800 shadow-sm ring-1 ring-brand-200 hover:bg-brand-50"
                            : "bg-transparent text-neutral-500 hover:bg-white/80",
                      )}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                      ) : null}
                      {step.label}
                    </button>
                  );
                })}
              </div>

              {undoTarget && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, undoTarget.status)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden />
                  Undo · revert to {undoTarget.label}
                </button>
              )}
            </div>
          )}

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
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
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

          {!isCancelled && (
            <div className="border-t border-neutral-200 pt-3">
              {cancelConfirm ? (
                <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-900">
                    Cancel order {order.id}?
                  </p>
                  {order.orderStatus === "completed" && (
                    <p className="text-xs text-red-800">
                      This order was already marked completed. Cancelling will
                      move it out of the completed column. Use this for no-shows
                      or chargebacks discovered after the fact.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        onCancelOrder(order.id);
                        setCancelConfirm(false);
                      }}
                    >
                      Yes, cancel order
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCancelConfirm(false)}
                    >
                      Go back
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setCancelConfirm(true)}
                >
                  Cancel order
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

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

  return (
    <div className="fixed inset-0 z-50 flex" role="presentation">
      <OrderDetailsPanel
        key={order.id}
        order={order}
        onClose={onClose}
        onUpdateStatus={onUpdateStatus}
        onCancelOrder={onCancelOrder}
      />
    </div>
  );
}
