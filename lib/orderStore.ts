import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { normalizeOrderCode } from "./orderCode";
import {
  ACTIVE_ORDER_STATUSES,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "./types";

type OrderRecord = {
  orderCode: string;
  createdAt: Date;
  updatedAt: Date;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
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

/**
 * `"preparing"` was an older intermediate status that was removed when the
 * staff workflow was simplified. Any document still holding it is surfaced
 * as `"acknowledged"` so the dashboard can render and progress it normally.
 */
function normalizeOrderStatus(raw: string): OrderStatus {
  if (raw === "preparing") return "acknowledged";
  return raw as OrderStatus;
}

function dbToOrder(record: OrderRecord): Order {
  return {
    id: record.orderCode,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    paymentMethod: record.paymentMethod as PaymentMethod,
    paymentStatus: record.paymentStatus as PaymentStatus,
    orderStatus: normalizeOrderStatus(record.orderStatus),
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
  const code = normalizeOrderCode(id);
  if (!code) return undefined;
  const record = await prisma.order.findUnique({
    where: { orderCode: code },
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

/**
 * Dashboard board fetch: returns every active order (regardless of age, so a
 * rare 3-day-old "acknowledged" order never disappears) plus every completed /
 * cancelled order placed in the last `windowHours` hours. Anything older is
 * reachable via `searchOrders`.
 */
export async function listRecentAndActive(opts: {
  windowHours: number;
  limit?: number;
}): Promise<Order[]> {
  const { windowHours } = opts;
  const limit = Math.min(opts.limit ?? 500, 500);
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const records = await prisma.order.findMany({
    where: {
      OR: [
        { orderStatus: { in: ACTIVE_ORDER_STATUSES } },
        { createdAt: { gte: since } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return records.map((r) => dbToOrder(r as unknown as OrderRecord));
}

/**
 * Server-side, DB-backed search for older orders. Matches against order code,
 * pickup name, and pickup phone. Intentionally capped at a small limit so the
 * UI can render it cheaply.
 *
 * The regex used here is case-insensitive and anchored in the `contains`
 * sense — MongoDB will scan rather than use a B-tree index, which is fine up
 * to tens of thousands of orders. For hundreds of thousands, switch to Atlas
 * Search (free tier available).
 */
export async function searchOrders(
  rawQuery: string,
  limit = 50,
): Promise<Order[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];
  const cappedLimit = Math.min(limit, 100);

  // Normalise phone input: stripped digits match stored formatted numbers
  // poorly, so we fall back on a "digits anywhere" pattern too.
  const digitsOnly = query.replace(/\D+/g, "");

  const records = await prisma.order.findMany({
    where: {
      OR: [
        { orderCode: { contains: query, mode: "insensitive" } },
        { pickupName: { contains: query, mode: "insensitive" } },
        { pickupPhone: { contains: query } },
        ...(digitsOnly.length >= 3
          ? [{ pickupPhone: { contains: digitsOnly } }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: cappedLimit,
  });
  return records.map((r) => dbToOrder(r as unknown as OrderRecord));
}

export interface UpdateOrderFields {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  staffNote?: string;
}

export async function updateOrder(
  orderCode: string,
  fields: UpdateOrderFields,
): Promise<Order | undefined> {
  const code = normalizeOrderCode(orderCode);
  if (!code) return undefined;

  const data: Record<string, unknown> = { ...fields };

  // Stamp the new stage and clear any "ahead" stage timestamps so reverse
  // transitions (e.g. completed → ready, ready → acknowledged) don't leave
  // misleading "Completed at …" history on a now-active order. `cancelled`
  // preserves the prior stamps so the audit trail of how far it got is intact.
  const now = new Date();
  switch (fields.orderStatus) {
    case "new":
      data.acknowledgedAt = null;
      data.readyAt = null;
      data.completedAt = null;
      data.cancelledAt = null;
      break;
    case "acknowledged":
      data.acknowledgedAt = now;
      data.readyAt = null;
      data.completedAt = null;
      data.cancelledAt = null;
      break;
    case "ready":
      data.readyAt = now;
      data.completedAt = null;
      data.cancelledAt = null;
      break;
    case "completed":
      data.completedAt = now;
      data.cancelledAt = null;
      break;
    case "cancelled":
      data.cancelledAt = now;
      break;
  }

  try {
    const record = await prisma.order.update({
      where: { orderCode: code },
      data,
    });
    return dbToOrder(record as unknown as OrderRecord);
  } catch (error) {
    // P2025 = no order with that code — a true not-found. Anything else
    // (connection loss, etc.) must surface as a server error, not a 404.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return undefined;
    }
    console.error("[updateOrder] failed:", error);
    throw error;
  }
}
