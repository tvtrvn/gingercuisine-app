const STORAGE_KEY = "gc_recent_orders";
const MAX_ENTRIES = 5;
/** Drop entries older than this (ms). */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface StoredOrder {
  orderId: string;
  token: string;
  placedAt: string;
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readRaw(): StoredOrder[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is StoredOrder =>
        !!x &&
        typeof (x as StoredOrder).orderId === "string" &&
        typeof (x as StoredOrder).token === "string" &&
        typeof (x as StoredOrder).placedAt === "string",
    );
  } catch {
    return [];
  }
}

function writeRaw(list: StoredOrder[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

function pruneAge(list: StoredOrder[]): StoredOrder[] {
  const now = Date.now();
  return list.filter(
    (o) => now - new Date(o.placedAt).getTime() <= MAX_AGE_MS,
  );
}

/** Recent in-flight orders for this device (no server account). */
export function listRecentOrders(): StoredOrder[] {
  const raw = readRaw();
  const list = pruneAge(raw);
  if (list.length !== raw.length) writeRaw(list);
  return list;
}

export function rememberOrder(entry: StoredOrder) {
  if (!isBrowser()) return;
  const next = [
    entry,
    ...pruneAge(readRaw()).filter((o) => o.orderId !== entry.orderId),
  ].slice(0, MAX_ENTRIES);
  writeRaw(next);
}

export function forgetOrder(orderId: string) {
  if (!isBrowser()) return;
  writeRaw(pruneAge(readRaw()).filter((o) => o.orderId !== orderId));
}

export { STORAGE_KEY as RECENT_ORDERS_STORAGE_KEY };
