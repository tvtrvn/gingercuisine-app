import { OrderStatus, PosEntryStatus } from "@/lib/types";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-rose-100 text-rose-800 border-rose-200",
  acknowledged: "bg-amber-100 text-amber-800 border-amber-200",
  preparing: "bg-sky-100 text-sky-800 border-sky-200",
  ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-neutral-100 text-neutral-700 border-neutral-200",
  cancelled: "bg-neutral-200 text-neutral-500 border-neutral-300",
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  preparing: "Preparing",
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

const POS_STYLES: Record<PosEntryStatus, string> = {
  not_entered: "bg-rose-50 text-rose-700 border-rose-200",
  entered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const POS_LABEL: Record<PosEntryStatus, string> = {
  not_entered: "POS: Not entered",
  entered: "POS: Entered",
};

export function PosEntryBadge({ status }: { status: PosEntryStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${POS_STYLES[status]}`}
    >
      {POS_LABEL[status]}
    </span>
  );
}
