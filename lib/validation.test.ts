import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { pickupDetailsSchema } from "./validation";

// 2026-07-05T22:00:00Z == 18:00 in America/Toronto (EDT, UTC-4).
const TORONTO_6PM_UTC = new Date("2026-07-05T22:00:00Z");

const base = {
  name: "Test Customer",
  phone: "416 967 1111",
  email: "",
  pickupTimeOption: "later" as const,
};

describe("pickupDetailsSchema pickupTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TORONTO_6PM_UTC);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a well-formed future time inside the window", () => {
    const r = pickupDetailsSchema.safeParse({ ...base, pickupTime: "19:30" });
    expect(r.success).toBe(true);
  });

  it("rejects malformed times that lexically sort inside the window", () => {
    // "1a:00" sorts between "11:30" and "22:45" so a pure string-range
    // comparison lets it through; the format regex must reject it.
    for (const bad of ["1a:00", "12:0x", "12;30", "9:30"]) {
      const r = pickupDetailsSchema.safeParse({ ...base, pickupTime: bad });
      expect(r.success, `expected "${bad}" to be rejected`).toBe(false);
    }
  });

  it("rejects times outside the pickup window", () => {
    for (const bad of ["11:29", "22:46", "23:00"]) {
      const r = pickupDetailsSchema.safeParse({ ...base, pickupTime: bad });
      expect(r.success, `expected "${bad}" to be rejected`).toBe(false);
    }
  });

  it("rejects a pickup time earlier than the current Toronto time", () => {
    // Now is 18:00 Toronto; noon is in the past.
    const r = pickupDetailsSchema.safeParse({ ...base, pickupTime: "12:00" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(JSON.stringify(r.error.flatten())).toMatch(/passed/i);
    }
  });

  it("accepts asap orders without a pickupTime regardless of clock", () => {
    const r = pickupDetailsSchema.safeParse({
      ...base,
      pickupTimeOption: "asap" as const,
      pickupTime: undefined,
    });
    expect(r.success).toBe(true);
  });
});
