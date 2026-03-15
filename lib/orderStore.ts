import { prisma } from "./prisma";
import { Order } from "./types";

function dbToOrder(record: {
  orderCode: string;
  createdAt: Date;
  paymentMethod: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  pickupName: string;
  pickupPhone: string;
  pickupEmail: string | null;
  pickupTimeOption: string;
  pickupTime: string | null;
  itemsJson: string;
}): Order {
  return {
    id: record.orderCode,
    createdAt: record.createdAt.toISOString(),
    paymentMethod: record.paymentMethod as Order["paymentMethod"],
    status: record.status as Order["status"],
    pickupDetails: {
      name: record.pickupName,
      phone: record.pickupPhone,
      email: record.pickupEmail ?? undefined,
      pickupTimeOption: record.pickupTimeOption as "asap" | "later",
      pickupTime: record.pickupTime ?? undefined,
    },
    items: JSON.parse(record.itemsJson),
    totals: {
      subtotal: record.subtotal,
      tax: record.tax,
      total: record.total,
    },
  };
}

export async function addOrder(order: Order, stripeSessionId?: string) {
  const stripeSessionData = stripeSessionId ? { stripeSessionId } : {};

  await prisma.order.upsert({
    where: { orderCode: order.id },
    update: {
      ...stripeSessionData,
      paymentStatus: order.paymentMethod === "stripe" ? "paid" : "pending",
      status: order.status,
      itemsJson: JSON.stringify(order.items),
      subtotal: order.totals.subtotal,
      tax: order.totals.tax,
      total: order.totals.total,
      pickupName: order.pickupDetails.name,
      pickupPhone: order.pickupDetails.phone,
      pickupEmail: order.pickupDetails.email ?? null,
      pickupTimeOption: order.pickupDetails.pickupTimeOption,
      pickupTime: order.pickupDetails.pickupTime ?? null,
      webhookProcessedAt:
        order.paymentMethod === "stripe" ? new Date() : undefined,
    },
    create: {
      orderCode: order.id,
      ...stripeSessionData,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentMethod === "stripe" ? "paid" : "pending",
      status: order.status,
      itemsJson: JSON.stringify(order.items),
      subtotal: order.totals.subtotal,
      tax: order.totals.tax,
      total: order.totals.total,
      pickupName: order.pickupDetails.name,
      pickupPhone: order.pickupDetails.phone,
      pickupEmail: order.pickupDetails.email ?? null,
      pickupTimeOption: order.pickupDetails.pickupTimeOption,
      pickupTime: order.pickupDetails.pickupTime ?? null,
      webhookProcessedAt: order.paymentMethod === "stripe" ? new Date() : null,
    },
  });
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const record = await prisma.order.findUnique({
    where: { orderCode: id },
  });
  if (!record) return undefined;
  return dbToOrder(record);
}

export async function listRecentOrders(limit = 20): Promise<Order[]> {
  const records = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return records.map(dbToOrder);
}

