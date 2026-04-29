import { randomBytes } from "node:crypto";

/** Crockford base32 — no confusable letters I/L/O/U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const ORDER_CODE_LENGTH = 6;

/**
 * ~32^6 possible codes (≈1B). Duplicate DB insert is caught and retried in
 * `POST /api/order`; `orderCode` is unique in Prisma.
 */
export function generateOrderCode(): string {
  const buf = randomBytes(ORDER_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < ORDER_CODE_LENGTH; i++) {
    out += ALPHABET[buf[i]! % ALPHABET.length];
  }
  return out;
}

/**
 * Canonical form for lookups. Uppercases ASCII; maps common OCR/typo
 * confusables (`I`,`L`,`O`) to Crockford digits. Leaves hyphens intact for
 * legacy `GC-*` codes.
 */
export function normalizeOrderCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
}
