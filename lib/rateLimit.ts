import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { DASHBOARD_COOKIE_NAME } from "./dashboardAuth";

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

/**
 * Best-effort Redis health ping. Reuses the shared singleton and sends a
 * trivial `PING` so the Upstash free-tier instance keeps seeing traffic and
 * doesn't get archived for inactivity. Called by the weekly cron heartbeat.
 *
 * Never throws — returns a status object so the heartbeat can stay best-effort.
 * `skipped: true` means Upstash isn't configured (local dev), so there's
 * nothing to ping.
 */
export async function pingRedis(): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
}> {
  const redis = getRedis();
  if (!redis) return { ok: false, skipped: true };
  try {
    await redis.ping();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
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
        // Fail closed in production so a missing Upstash config can't
        // silently disable every limiter on a deployed instance. Local
        // dev keeps the no-op behavior.
        if (process.env.NODE_ENV === "production") {
          return {
            success: false,
            limit: 0,
            remaining: 0,
            reset: Date.now() + 60_000,
          };
        }
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

// Per-staff-session cap on dashboard reads (board polling + single-order
// detail GETs). Generous, but bounded so a hijacked or XSS-pulled cookie
// can't scrape the entire order history in a tight loop.
export const dashboardReadRateLimit = makeLimiter((redis) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    analytics: true,
    prefix: "rl:dash-read",
  }),
);

// Per-staff-session cap on dashboard searches. Search hits the DB harder
// than a normal board fetch (it may scan older history), so cap it lower.
export const dashboardSearchRateLimit = makeLimiter((redis) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "rl:dash-search",
  }),
);

/** Customer order-status polling — token-gated lightweight GET. */
export const orderStatusRateLimit = makeLimiter((redis) =>
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "rl:order-status",
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

/**
 * Build a rate-limit key for a dashboard request. Prefers a hash of the
 * session cookie so a whole restaurant behind one NAT doesn't share a single
 * IP bucket; falls back to IP when the cookie isn't present yet (e.g. login).
 * The cookie value is never logged or stored — only a 16-byte hex prefix of
 * its sha256 hash is used as the key.
 */
export async function dashboardRateLimitKey(req: NextRequest): Promise<string> {
  const store = await cookies();
  const session = store.get(DASHBOARD_COOKIE_NAME)?.value;
  if (session) {
    return `sess:${createHash("sha256").update(session).digest("hex").slice(0, 32)}`;
  }
  return `ip:${getClientIp(req)}`;
}
