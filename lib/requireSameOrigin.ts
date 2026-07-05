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
/**
 * In production, anchor the check to the configured public site host instead
 * of the inbound Host header (which is attacker-influenceable). Preview
 * deploys and local dev keep Host-based matching so their own origins work.
 */
function configuredProductionHost(): string | null {
  if (process.env.VERCEL_ENV !== "production") return null;
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return null;
  try {
    return new URL(configured).host;
  } catch {
    return null;
  }
}

export function isSameOrigin(req: NextRequest): boolean {
  const expectedHost = configuredProductionHost() ?? req.headers.get("host");
  if (!expectedHost) return false;

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
      if (url.host === expectedHost) return true;
    } catch {
      // ignore malformed header
    }
  }
  return false;
}
