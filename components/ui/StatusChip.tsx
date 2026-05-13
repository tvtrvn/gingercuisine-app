import { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className:
      "border-blue-200 bg-blue-50 text-blue-900 ring-1 ring-blue-100/80",
  },
  acknowledged: {
    label: "Acknowledged",
    className:
      "border-violet-200 bg-violet-50 text-violet-900 ring-1 ring-violet-100/80",
  },
  ready: {
    label: "Ready",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100/80",
  },
  completed: {
    label: "Completed",
    className: "border-neutral-200 bg-neutral-100 text-neutral-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-red-200 bg-red-50 text-red-800",
  },
};

export function StatusChip({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
