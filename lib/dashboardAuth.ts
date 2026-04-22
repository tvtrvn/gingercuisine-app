import { createHmac, timingSafeEqual } from "crypto";

export const DASHBOARD_COOKIE_NAME = "gc_dashboard_session";
// 12 hours; staff can re-auth at the start of a shift.
export const DASHBOARD_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecret(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "DASHBOARD_SESSION_SECRET is missing or too short (need 16+ chars).",
    );
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + DASHBOARD_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `v1.${issuedAt}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, issuedAt, expiresAt, signature] = parts;
  if (version !== "v1") return false;

  const payload = `${version}.${issuedAt}.${expiresAt}`;
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  const exp = Number(expiresAt);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  return true;
}

export function verifyDashboardPassword(submitted: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    console.error("DASHBOARD_PASSWORD is not set. Login blocked.");
    return false;
  }
  if (submitted.length !== expected.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(submitted),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}
