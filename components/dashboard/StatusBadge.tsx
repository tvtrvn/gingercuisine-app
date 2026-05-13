import { OrderStatus } from "@/lib/types";
import { StatusChip } from "@/components/ui/StatusChip";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusChip status={status} />;
}
