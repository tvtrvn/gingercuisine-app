import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import {
  ACTIVE_ORDER_STATUSES,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PosEntryStatus,
} from "./types";

type OrderRecord = {
  orderCode: string;
  createdAt: Date;
  updatedAt: Date;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  posEntryStatus: string;
  source: string;
  staffNote: string | null;
  viewToken: string | null;
  acknowledgedAt: Date | null;
  readyAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  subtotal: number;
  tax: number;
  total: number;
  pickupName: string;
  pickupPhone: string;
  pickupEmail: string | null;
  pickupTimeOption: string;
  pickupTime: string | null;
  itemsJson: string;
};

function dbToOrder(record: OrderRecord): Order {
  return {
    id: record.orderCode,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    paymentMethod: record.paymentMethod as PaymentMethod,
    paymentStatus: record.paymentStatus as PaymentStatus,
    orderStatus: record.orderStatus as OrderStatus,
    posEntryStatus: record.posEntryStatus as PosEntryStatus,
    source: "website",
    staffNote: record.staffNote ?? undefined,
    viewToken: record.viewToken ?? undefined,
    acknowledgedAt: record.acknowledgedAt?.toISOString(),
    readyAt: record.readyAt?.toISOString(),
    completedAt: record.completedAt?.toISOString(),
    cancelledAt: record.cancelledAt?.toISOString(),
    pickupDetails: {
      name: record.pickupName,
      phone: record.pickupPhone,
      email: record.pickupEmail ?? undefined,
      pickupTimeOption: record.pickupTimeOption as "asap" | "later",
      pickupTime: record.pickupTime ?? undefined,
    },
    items: JSON.parse(record.itemsJson) as CartItem[],
    totals: {
      subtotal: record.subtotal,
      tax: record.tax,
      total: record.total,
    },
  };
}

export interface CreateOrderInput {
  orderCode: string;
  items: CartItem[];
  pickupDetails: Order["pickupDetails"];
  subtotal: number;
  tax: number;
  total: number;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const viewToken = randomBytes(16).toString("hex"); // 32-char hex
  const record = await prisma.order.create({
    data: {
      orderCode: input.orderCode,
      paymentMethod: "pay_in_person",
      paymentStatus: "unpaid",
      orderStatus: "new",
      posEntryStatus: "not_entered",
      source: "website",
      viewToken,
      itemsJson: JSON.stringify(input.items),
      subtotal: input.subtotal,
      tax: input.tax,
      total: input.total,
      pickupName: input.pickupDetails.name,
      pickupPhone: input.pickupDetails.phone,
      pickupEmail: input.pickupDetails.email ?? null,
      pickupTimeOption: input.pickupDetails.pickupTimeOption,
      pickupTime: input.pickupDetails.pickupTime ?? null,
    },
  });
  return dbToOrder(record as unknown as OrderRecord);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const record = await prisma.order.findUnique({
    where: { orderCode: id },
  });
  if (!record) return undefined;
  return dbToOrder(record as unknown as OrderRecord);
}

export interface ListOrdersOptions {
  limit?: number;
  activeOnly?: boolean;
  statuses?: OrderStatus[];
  since?: Date;
}

export async function listOrders(
  opts: ListOrdersOptions = {},
): Promise<Order[]> {
  const { limit = 100, activeOnly, statuses, since } = opts;

  const where: Record<string, unknown> = {};
  if (statuses && statuses.length > 0) {
    where.orderStatus = { in: statuses };
  } else if (activeOnly) {
    where.orderStatus = { in: ACTIVE_ORDER_STATUSES };
  }
  if (since) {
    where.updatedAt = { gte: since };
  }

  const records = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return records.map((r) => dbToOrder(r as unknown as OrderRecord));
}

export interface UpdateOrderFields {
  orderStatus?: OrderStatus;
  posEntryStatus?: PosEntryStatus;
  paymentStatus?: PaymentStatus;
  staffNote?: string;
}

export async function updateOrder(
  orderCode: string,
  fields: UpdateOrderFields,
): Promise<Order | undefined> {
  const data: Record<string, unknown> = { ...fields };

  const now = new Date();
  if (fields.orderStatus === "acknowledged") data.acknowledgedAt = now;
  if (fields.orderStatus === "ready") data.readyAt = now;
  if (fields.orderStatus === "completed") data.completedAt = now;
  if (fields.orderStatus === "cancelled") data.cancelledAt = now;

  try {
    const record = await prisma.order.update({
      where: { orderCode },
      data,
    });
    return dbToOrder(record as unknown as OrderRecord);
  } catch (error) {
    console.error("[updateOrder] failed:", error);
    return undefined;
  }
}
