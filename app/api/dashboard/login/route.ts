import {
  DASHBOARD_COOKIE_NAME,
  DASHBOARD_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifyDashboardPassword,
} from "@/lib/dashboardAuth";
import {
  getClientIp,
  loginRateLimit,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/requireSameOrigin";
import { dashboardLoginSchema } from "@/lib/validation";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await loginRateLimit.limit(`ip:${getClientIp(req)}`);
  if (!rl.success) {
    return NextResponse.json(
      {
        error:
          "Too many login attempts. Please wait a minute before trying again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds(rl.reset)),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      },
    );
  }

  try {
    const json = await req.json();
    const parsed = dashboardLoginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (!verifyDashboardPassword(parsed.data.password)) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 },
      );
    }

    const token = createSessionToken();
    const cookieStore = await cookies();
    cookieStore.set(DASHBOARD_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DASHBOARD_SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/dashboard/login]", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
