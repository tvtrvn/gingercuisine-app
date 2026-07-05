import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("./prisma", () => ({
  prisma: { order: { update: vi.fn() } },
}));

import { prisma } from "./prisma";
import { updateOrder } from "./orderStore";

const updateMock = vi.mocked(prisma.order.update);

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
