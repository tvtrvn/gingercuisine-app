import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("./prisma", () => ({
  prisma: {
    order: { update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "./prisma";
import { updateOrder, OrderStatusConflictError } from "./orderStore";

const updateMock = vi.mocked(prisma.order.update);
const updateManyMock = vi.mocked(prisma.order.updateMany);
const findUniqueMock = vi.mocked(prisma.order.findUnique);

function orderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "68b1",
    orderCode: "ABC234",
    paymentMethod: "pay_in_person",
    paymentStatus: "unpaid",
    orderStatus: "acknowledged",
    source: "website",
    pickupName: "Thi",
    pickupPhone: "+14161234567",
    pickupEmail: null,
    pickupTimeOption: "asap",
    pickupTime: null,
    itemsJson: "[]",
    subtotal: 10,
    tax: 1.3,
    total: 11.3,
    staffNote: null,
    viewToken: "ab".repeat(16),
    acknowledgedAt: new Date("2026-07-11T01:00:00Z"),
    readyAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date("2026-07-11T00:00:00Z"),
    updatedAt: new Date("2026-07-11T01:00:00Z"),
    ...overrides,
  };
}

describe("updateOrder error mapping", () => {
  beforeEach(() => {
    updateMock.mockReset();
  });

  it("returns undefined when the order does not exist (P2025)", async () => {
    updateMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("No document found", {
        code: "P2025",
        clientVersion: "6.0.0",
      }),
    );
    const result = await updateOrder("ABC234", { orderStatus: "acknowledged" });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it("rethrows unexpected database errors instead of masking them as not-found", async () => {
    updateMock.mockRejectedValueOnce(new Error("connection pool closed"));
    await expect(
      updateOrder("ABC234", { orderStatus: "acknowledged" }),
    ).rejects.toThrow("connection pool closed");
    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});

describe("updateOrder guarded transitions (compare-and-set)", () => {
  beforeEach(() => {
    updateMock.mockReset();
    updateManyMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("applies the update when the order is still at expectedStatus", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 1 });
    findUniqueMock.mockResolvedValueOnce(
      orderRecord({ orderStatus: "ready", readyAt: new Date() }),
    );
    const result = await updateOrder(
      "ABC234",
      { orderStatus: "ready" },
      { expectedStatus: "acknowledged" },
    );
    expect(updateManyMock).toHaveBeenCalledTimes(1);
    const where = updateManyMock.mock.calls[0][0]?.where as Record<
      string,
      unknown
    >;
    expect(where.orderCode).toBe("ABC234");
    // legacy "preparing" docs surface as "acknowledged", so the guard must
    // match both stored spellings
    expect(where.orderStatus).toEqual({ in: ["acknowledged", "preparing"] });
    expect(result?.orderStatus).toBe("ready");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("guards non-acknowledged statuses on exactly that status", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 1 });
    findUniqueMock.mockResolvedValueOnce(
      orderRecord({ orderStatus: "completed", completedAt: new Date() }),
    );
    await updateOrder(
      "ABC234",
      { orderStatus: "completed" },
      { expectedStatus: "ready" },
    );
    const where = updateManyMock.mock.calls[0][0]?.where as Record<
      string,
      unknown
    >;
    expect(where.orderStatus).toEqual({ in: ["ready"] });
  });

  it("throws OrderStatusConflictError carrying the current order when the row moved", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 0 });
    findUniqueMock.mockResolvedValueOnce(
      orderRecord({ orderStatus: "cancelled", cancelledAt: new Date() }),
    );
    const err: unknown = await updateOrder(
      "ABC234",
      { orderStatus: "completed" },
      { expectedStatus: "ready" },
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(OrderStatusConflictError);
    expect((err as OrderStatusConflictError).current.orderStatus).toBe(
      "cancelled",
    );
  });

  it("returns undefined when the guarded row no longer exists", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 0 });
    findUniqueMock.mockResolvedValueOnce(null);
    const result = await updateOrder(
      "ABC234",
      { orderStatus: "completed" },
      { expectedStatus: "ready" },
    );
    expect(result).toBeUndefined();
  });
});

describe("dbToOrder resilience", () => {
  beforeEach(() => {
    updateMock.mockReset();
  });

  it("maps corrupt itemsJson to empty items instead of throwing", async () => {
    updateMock.mockResolvedValueOnce(orderRecord({ itemsJson: "{not json" }));
    const result = await updateOrder("ABC234", { staffNote: "called back" });
    expect(result?.items).toEqual([]);
    expect(result?.orderStatus).toBe("acknowledged");
  });

  it("maps non-array itemsJson to empty items", async () => {
    updateMock.mockResolvedValueOnce(
      orderRecord({ itemsJson: '{"a":1}' }),
    );
    const result = await updateOrder("ABC234", { staffNote: "x" });
    expect(result?.items).toEqual([]);
  });
});
