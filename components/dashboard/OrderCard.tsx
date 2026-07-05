"use client";

import { Badge } from "@/components/ui/Badge";
import { CURRENCY } from "@/lib/config";
import { Order, OrderStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Check, ChevronRight, Undo2 } from "lucide-react";
import { ElapsedTime } from "./ElapsedTime";
import { OrderStatusBadge } from "./StatusBadge";

interface OrderCardProps {
  order: Order;
  isNewUnacknowledged: boolean;
  onOpenDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, next: OrderStatus) => void;
  disabled?: boolean;
}

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

const WORKFLOW_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "acknowledged", label: "Acknowledge" },
  { status: "ready", label: "Ready" },
  { status: "completed", label: "Completed" },
];

// Reverse-step map for the Undo control. `new` has nothing to undo;
// `cancelled` is reversed via the explicit "Reopen as new" affordance.
const UNDO_TARGET: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  acknowledged: { status: "new", label: "New" },
  ready: { status: "acknowledged", label: "Acknowledged" },
  completed: { status: "ready", label: "Ready" },
};

export function OrderCard({
  order,
  isNewUnacknowledged,
  onOpenDetails,
  onUpdateStatus,
  disabled,
}: OrderCardProps) {
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const pickupLabel =
    order.pickupDetails.pickupTimeOption === "asap"
      ? "ASAP"
      : order.pickupDetails.pickupTime ?? "Later";

  const firstNote = order.items
    .map((i) => i.notes?.trim())
    .find((n) => n && n.length > 0);

  const rankCurrent = statusRank(order.orderStatus);
  // Only `cancelled` is a hard terminal in the UI now. `completed` still shows
  // the segmented control (all checked) and the Undo button so staff can
  // recover from mis-taps.
  const isCancelled = order.orderStatus === "cancelled";
  const undoTarget = UNDO_TARGET[order.orderStatus];

  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-[var(--shadow-card)] transition-shadow duration-200",
        isNewUnacknowledged
          ? "border-blue-300 animate-dashboard-new-ring"
          : "border-neutral-200 hover:border-neutral-300 hover:shadow-[var(--shadow-card-hover)]",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-bold text-neutral-900">
              {order.id}
            </p>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <p className="text-lg font-semibold leading-snug text-neutral-900">
            {order.pickupDetails.name}
          </p>
          <p className="text-xs text-neutral-600">{order.pickupDetails.phone}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide",
              order.pickupDetails.pickupTimeOption === "asap"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "border border-blue-200 bg-blue-50 text-blue-900",
            )}
          >
            Pickup · {pickupLabel}
          </span>
          <p className="text-[11px] text-neutral-500">
            <ElapsedTime since={order.createdAt} /> ago
          </p>
        </div>
      </header>

      {firstNote && (
        <div className="flex items-start gap-2">
          <Badge tone="warning" dot className="max-w-full shrink-0 text-[10px]">
            <span className="line-clamp-2">Notes: {firstNote}</span>
          </Badge>
        </div>
      )}

      <div className="rounded-xl border border-neutral-100 bg-neutral-50/90 px-3 py-2.5 text-sm text-neutral-800">
        <p className="font-semibold text-neutral-900">
          {totalItems} item{totalItems === 1 ? "" : "s"} ·{" "}
          {formatCurrency(order.totals.total, CURRENCY)}
        </p>
        <ul className="mt-1.5 space-y-0.5 text-xs text-neutral-700">
          {order.items.slice(0, 3).map((item) => (
            <li key={item.id} className="truncate">
              {item.quantity} × {item.name}
              {item.selectedSize ? ` (${item.selectedSize.label})` : ""}
            </li>
          ))}
          {order.items.length > 3 && (
            <li className="text-neutral-500">
              + {order.items.length - 3} more…
            </li>
          )}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700">
          Pay in person · Unpaid
        </span>
      </div>

      {!isCancelled && (
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
          {WORKFLOW_STEPS.map((step, idx) => {
            const targetRank = statusRank(step.status);
            const done = rankCurrent >= targetRank;
            const isNext =
              !done &&
              (idx === 0 ||
                rankCurrent >= statusRank(WORKFLOW_STEPS[idx - 1]!.status));

            return (
              <button
                key={step.status}
                type="button"
                disabled={disabled}
                onClick={() => onUpdateStatus(order.id, step.status)}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-bold uppercase leading-tight transition-colors duration-200 sm:text-[11px]",
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
                <span className="text-center">{step.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2">
        <button
          type="button"
          onClick={() => onOpenDetails(order)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 transition-colors hover:text-brand-950"
        >
          View details
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>

        {undoTarget && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpdateStatus(order.id, undoTarget.status)}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Undo: revert order ${order.id} back to ${undoTarget.label}`}
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
            Undo · back to {undoTarget.label}
          </button>
        )}

        {isCancelled && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpdateStatus(order.id, "new")}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Reopen cancelled order ${order.id} as new`}
            data-testid="reopen-order"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
            Reopen as new
          </button>
        )}
      </div>
    </article>
  );
}
