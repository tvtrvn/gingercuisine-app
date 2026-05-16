/**
 * Small key/value layer over the `RestaurantSetting` collection. Each setting
 * is stored as a JSON string keyed by a stable name, so we can add new toggles
 * without further schema work.
 *
 * Only one toggle exists today: `orderingPause`.
 */

import { prisma } from "./prisma";

const ORDERING_PAUSE_KEY = "orderingPause";

const MAX_REASON_LENGTH = 200;

export interface OrderingPauseState {
  paused: boolean;
  /** Optional free-form reason staff entered (shown to customers). */
  reason?: string;
  /** ISO timestamp of the most recent pause activation. */
  pausedAt?: string;
}

function safeParse(raw: string): OrderingPauseState {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "paused" in parsed &&
      typeof (parsed as { paused: unknown }).paused === "boolean"
    ) {
      const obj = parsed as Record<string, unknown>;
      return {
        paused: obj.paused as boolean,
        reason:
          typeof obj.reason === "string" && obj.reason.length > 0
            ? obj.reason
            : undefined,
        pausedAt:
          typeof obj.pausedAt === "string" ? obj.pausedAt : undefined,
      };
    }
  } catch {
    // fall through
  }
  return { paused: false };
}

export async function getOrderingPause(): Promise<OrderingPauseState> {
  try {
    const row = await prisma.restaurantSetting.findUnique({
      where: { key: ORDERING_PAUSE_KEY },
    });
    if (!row) return { paused: false };
    return safeParse(row.value);
  } catch (error) {
    // If the settings collection is unreachable we deliberately default to
    // NOT paused. The hours check + customer feedback will still kick in,
    // and a transient DB blip shouldn't lock the restaurant out of taking
    // orders.
    console.error("[restaurantSettings] getOrderingPause failed:", error);
    return { paused: false };
  }
}

export async function setOrderingPause(input: {
  paused: boolean;
  reason?: string;
}): Promise<OrderingPauseState> {
  const trimmedReason =
    typeof input.reason === "string"
      ? input.reason.trim().slice(0, MAX_REASON_LENGTH)
      : undefined;

  const next: OrderingPauseState = input.paused
    ? {
        paused: true,
        reason: trimmedReason && trimmedReason.length > 0 ? trimmedReason : undefined,
        pausedAt: new Date().toISOString(),
      }
    : { paused: false };

  const payload = JSON.stringify(next);
  await prisma.restaurantSetting.upsert({
    where: { key: ORDERING_PAUSE_KEY },
    create: { key: ORDERING_PAUSE_KEY, value: payload },
    update: { value: payload },
  });
  return next;
}
