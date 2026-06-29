import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  availabilityRateLimit,
  dashboardReadRateLimit,
  orderRateLimit,
} from "@/lib/rateLimit";

// The in-memory limiters don't read Upstash at all; the Redis-backed ones go
// through getRedis(), which returns null (and, outside production, a permissive
// no-op) when Upstash isn't configured. We unset Upstash here so the two paths
// are behaviorally distinguishable — that's exactly what locks the cost fix.
const savedUrl = process.env.UPSTASH_REDIS_REST_URL;
const savedToken = process.env.UPSTASH_REDIS_REST_TOKEN;

beforeAll(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});
afterAll(() => {
  if (savedUrl) process.env.UPSTASH_REDIS_REST_URL = savedUrl;
  if (savedToken) process.env.UPSTASH_REDIS_REST_TOKEN = savedToken;
});

describe("in-memory limiter (makeInMemoryLimiter via availabilityRateLimit)", () => {
  it("allows up to the cap then blocks, counting down remaining", async () => {
    const key = `exhaust-${Math.random()}`;
    let lastRemaining = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 60; i++) {
      const r = await availabilityRateLimit.limit(key);
      expect(r.success).toBe(true);
      lastRemaining = r.remaining;
    }
    expect(lastRemaining).toBe(0);
    expect((await availabilityRateLimit.limit(key)).success).toBe(false);
  });

  it("resets after the window elapses", async () => {
    vi.useFakeTimers();
    try {
      const key = "reset-key";
      for (let i = 0; i < 60; i++) await availabilityRateLimit.limit(key);
      expect((await availabilityRateLimit.limit(key)).success).toBe(false);
      vi.advanceTimersByTime(60_001);
      expect((await availabilityRateLimit.limit(key)).success).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Redis isolation — dashboard limiters must NOT depend on Redis", () => {
  it("dashboardReadRateLimit enforces its cap with Upstash unset (=> in-memory)", async () => {
    const key = `dash-${Math.random()}`;
    for (let i = 0; i < 120; i++) {
      expect((await dashboardReadRateLimit.limit(key)).success).toBe(true);
    }
    // The 121st is blocked — only possible if this is the in-memory limiter.
    // If it were reverted to a Redis-backed limiter it would no-op (always
    // allow) here, and this assertion would fail. That's the regression guard.
    expect((await dashboardReadRateLimit.limit(key)).success).toBe(false);
  });

  it("orderRateLimit (Redis-backed) no-ops when Upstash is unset", async () => {
    const key = `order-${Math.random()}`;
    for (let i = 0; i < 50; i++) {
      expect((await orderRateLimit.limit(key)).success).toBe(true);
    }
  });
});
