import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  DASHBOARD_COOKIE_NAME,
  verifySessionToken,
} from "./dashboardAuth";

export async function hasDashboardSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(DASHBOARD_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/**
 * Use inside API route handlers:
 *   const unauthorized = await requireDashboardApi();
 *   if (unauthorized) return unauthorized;
 */
export async function requireDashboardApi(): Promise<NextResponse | undefined> {
  if (!(await hasDashboardSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return undefined;
}
