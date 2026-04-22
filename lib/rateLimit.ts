import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

/**
 * Rate limiting via Upstash Redis + Upstash Ratelimit.
 *
 * Behavior:
 *   - If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set,
 *     requests are limited in a Redis sliding window (works correctly
 *     across Vercel serverless instances).
 *   - If they are NOT set (e.g. first-time local dev), the limiter is a
 *     no-op that always allows requests, and we log a warning ONCE so
 *     developers notice.
 *
 *  NEVER deploy to production without setting the env vars. The
 *  `ratelimitConfigured()` helper is used by a start-up log in
 *  `instrumentation.ts` to make that loud.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // ms since epoch
}

function isConfigured(): boolean {
  return (
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function ratelimitConfigured(): boolean {
  return isConfigured();
}

// Shared Redis instance (singleton)
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!isConfigured()) return null;
  if (_redis) return _redis;
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return _redis;
}

let warnedAboutMissingConfig = false;
function warnOnce() {
  if (warnedAboutMissingConfig) return;
  warnedAboutMissingConfig = true;
  console.warn(
    "[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not " +
      "set. Rate limiting is DISABLED. This is fine for local dev, but " +
      "MUST be configured before production deployment.",
  );
}

type LimiterFactory = (redis: Redis) => Ratelimit;

function makeLimiter(factory: LimiterFactory) {
  let instance: Ratelimit | null = null;
  return {
    async limit(key: string): Promise<RateLimitResult> {
      const redis = getRedis();
      if (!redis) {
        warnOnce();
        return {
          success: true,
          limit: Number.POSITIVE_INFINITY,
          remaining: Number.POSITIVE_INFINITY,
          reset: Date.now(),
        };
      }
      if (!instance) instance = factory(redis);
      const r = await instance.limit(key);
      return {
        success: r.success,
        limit: r.limit,
        remaining: r.remaining,
        reset: r.reset,
      };
    },
  };
}

// Strict: dashboard login — protect the password from brute force.
export const loginRateLimit = makeLimiter((redis) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "rl:login",
  }),
);

// Medium: order creation.
export const orderRateLimit = makeLimiter((redis) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "rl:order",
  }),
);

// Loose: contact form (spam control).
export const contactRateLimit = makeLimiter((redis) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
    prefix: "rl:contact",
  }),
);

// Per-staff-session cap on dashboard writes.
export const dashboardWriteRateLimit = makeLimiter((redis) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "rl:dash",
  }),
);

/**
 * Best-effort client IP for rate-limit keys. Falls back to "unknown" which
 * effectively rate-limits all un-identifiable requests as a single bucket
 * — this is intentional: we'd rather over-limit bots than let them slip.
 */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0];
    if (first) return first.trim();
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function retryAfterSeconds(resetMs: number): number {
  return Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
}
