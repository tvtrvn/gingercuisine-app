/**
 * Next.js instrumentation hook — runs once when the server boots (both on
 * Node.js and Edge runtimes). We use it as a single, loud place to verify
 * that production has the security-critical environment variables set.
 *
 * Boot continues either way: we can't crash a deploy from here without
 * also breaking previews and local dev, but missing config is logged at
 * `error` so it shows up clearly in Vercel logs.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const required = [
    "DATABASE_URL",
    "DASHBOARD_PASSWORD",
    "DASHBOARD_SESSION_SECRET",
  ] as const;

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(
      `[instrumentation] Missing required env vars in production: ${missing.join(
        ", ",
      )}. The site will not work correctly until these are set in Vercel.`,
    );
  }

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.error(
      "[instrumentation] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN " +
        "are not set in production. Rate limiting is DISABLED — login, " +
        "order, and contact endpoints are vulnerable to brute force / spam.",
    );
  }

  if (!process.env.CRON_SECRET) {
    console.warn(
      "[instrumentation] CRON_SECRET is not set. The MongoDB heartbeat " +
        "route at /api/cron/heartbeat will refuse to run, so the free " +
        "Atlas cluster may auto-pause after 30 days of inactivity.",
    );
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[instrumentation] RESEND_API_KEY is not set. Order emails to staff " +
        "will be silently skipped.",
    );
  }
}
