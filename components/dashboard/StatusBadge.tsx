import { OrderStatus } from "@/lib/types";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-rose-100 text-rose-800 border-rose-200",
  acknowledged: "bg-amber-100 text-amber-800 border-amber-200",
  ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-neutral-100 text-neutral-700 border-neutral-200",
  cancelled: "bg-neutral-200 text-neutral-500 border-neutral-300",
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_STYLES[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
