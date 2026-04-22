import type { NextRequest } from "next/server";

/**
 * Basic CSRF protection: require the request's Origin (or Referer, as a
 * fallback for clients that strip Origin) to match the Host the request
 * was actually sent to. State-changing endpoints should call this on every
 * POST / PATCH / DELETE.
 *
 * This is intentionally simple and stateless — it complements the HttpOnly
 * SameSite=Lax dashboard session cookie and the per-order view token.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return false;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  const candidates = [origin, referer].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );

  // If neither Origin nor Referer is present (e.g. curl / some bots),
  // treat the request as cross-origin for safety on state changes.
  if (candidates.length === 0) return false;

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (url.host === host) return true;
    } catch {
      // ignore malformed header
    }
  }
  return false;
}
