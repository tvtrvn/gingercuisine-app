import { DASHBOARD_COOKIE_NAME } from "@/lib/dashboardAuth";
import { isSameOrigin } from "@/lib/requireSameOrigin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.delete(DASHBOARD_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
