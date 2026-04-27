import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/**
 * Weekly Vercel Cron hits this route to run a trivial MongoDB `ping` so
 * Atlas M0 does not auto-pause after 30 days of inactivity.
 *
 * Set `CRON_SECRET` in Vercel: cron sends `Authorization: Bearer <secret>`.
 * @see https://vercel.com/docs/cron-jobs/usage-and-pricing#cron-secret
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error(
      "[cron/heartbeat] CRON_SECRET is not set; refusing to run.",
    );
    return NextResponse.json(
      { error: "Heartbeat not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !timingEqual(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$runCommandRaw({ ping: 1 });
    const ts = new Date().toISOString();
    console.log(`[cron/heartbeat] MongoDB ping ok at ${ts}`);
    return NextResponse.json({ ok: true, ts });
  } catch (err) {
    console.error("[cron/heartbeat] MongoDB ping failed:", err);
    return NextResponse.json(
      { error: "Database heartbeat failed" },
      { status: 500 },
    );
  }
}
