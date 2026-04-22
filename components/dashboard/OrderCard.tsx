"use client";

import { CURRENCY } from "@/lib/config";
import { Order, OrderStatus, PosEntryStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ElapsedTime } from "./ElapsedTime";
import { OrderStatusBadge, PosEntryBadge } from "./StatusBadge";

interface OrderCardProps {
  order: Order;
  isNewUnacknowledged: boolean;
  onOpenDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, next: OrderStatus) => void;
  onTogglePos: (orderId: string, next: PosEntryStatus) => void;
  disabled?: boolean;
}

function nextStatusLabel(status: OrderStatus): {
  next: OrderStatus | null;
  label: string;
} {
  switch (status) {
    case "new":
      return { next: "acknowledged", label: "Acknowledge" };
    case "acknowledged":
      return { next: "preparing", label: "Start preparing" };
    case "preparing":
      return { next: "ready", label: "Mark ready" };
    case "ready":
      return { next: "completed", label: "Mark completed" };
    default:
      return { next: null, label: "" };
  }
}

export function OrderCard({
  order,
  isNewUnacknowledged,
  onOpenDetails,
  onUpdateStatus,
  onTogglePos,
  disabled,
}: OrderCardProps) {
  const { next, label } = nextStatusLabel(order.orderStatus);
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const pickupLabel =
    order.pickupDetails.pickupTimeOption === "asap"
      ? "ASAP"
      : order.pickupDetails.pickupTime ?? "Later";

  return (
    <article
      className={`group flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition ${
        isNewUnacknowledged
          ? "border-rose-300 ring-2 ring-rose-200 ring-offset-1 animate-[pulse_2s_ease-in-out_infinite]"
          : "border-neutral-200"
      }`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-semibold text-neutral-900">
              {order.id}
            </p>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {order.pickupDetails.name}
          </p>
          <p className="text-xs text-neutral-600">
            {order.pickupDetails.phone}
          </p>
        </div>
        <div className="text-right text-xs text-neutral-600">
          <p className="font-semibold text-neutral-900">Pickup</p>
          <p>{pickupLabel}</p>
          <p className="mt-1 text-[11px]">
            <ElapsedTime since={order.createdAt} /> ago
          </p>
        </div>
      </header>

      <div className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
        <p className="font-semibold text-neutral-900">
          {totalItems} item{totalItems === 1 ? "" : "s"} ·{" "}
          {formatCurrency(order.totals.total, CURRENCY)}
        </p>
        <ul className="mt-1 space-y-0.5 text-xs text-neutral-700">
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
        <PosEntryBadge status={order.posEntryStatus} />
        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700">
          Pay in person · Unpaid
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpenDetails(order)}
          className="inline-flex flex-1 min-w-[120px] items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100"
        >
          View details
        </button>
        {next && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpdateStatus(order.id, next)}
            className="inline-flex flex-1 min-w-[120px] items-center justify-center rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {label}
          </button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onTogglePos(
              order.id,
              order.posEntryStatus === "entered" ? "not_entered" : "entered",
            )
          }
          className={`inline-flex flex-1 min-w-[120px] items-center justify-center rounded-full px-3 py-2 text-sm font-semibold shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 ${
            order.posEntryStatus === "entered"
              ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          {order.posEntryStatus === "entered"
            ? "Undo POS entry"
            : "Mark entered in POS"}
        </button>
      </div>
    </article>
  );
}
