/**
 * Combined "can a customer place an order right now?" check. This is the
 * single source of truth used by:
 *   - the order page (banner + disabled submit)
 *   - the /api/order POST handler (server-side enforcement)
 *   - the dashboard (so staff see exactly what customers see)
 *
 * Two independent gates:
 *   1. Hours — derived from `lib/hours.ts` and the restaurant's local TZ.
 *   2. Staff pause — a toggle stored in Mongo via `lib/restaurantSettings.ts`.
 *
 * Staff pause always wins. If staff have paused ordering manually we report
 * `paused`, even if the hours gate would also have been closed. This keeps
 * the wording staff entered visible to customers.
 */

import {
  getOpeningStatus,
  getWeeklyHoursLines,
  HOURS_TIMEZONE,
  LAST_ORDER_LEAD_MINUTES,
  type OpeningStatus,
} from "./hours";
import {
  getOrderingPause,
  type OrderingPauseState,
} from "./restaurantSettings";

export type OrderingClosedReason =
  | "paused"
  | "before_hours"
  | "after_hours"
  | "closed_today"
  | "last_call";

export interface OrderingAvailability {
  accepting: boolean;
  reason?: OrderingClosedReason;
  /** Customer-facing message. */
  message?: string;
  /** Whether the staff pause toggle is currently on. */
  staffPaused: boolean;
  /** Optional reason text staff entered when pausing. */
  staffPauseReason?: string;
  /** When staff toggled pause on. */
  staffPausedAt?: string;
  hours: {
    timezone: string;
    lastOrderLeadMinutes: number;
    today: OpeningStatus["today"];
    todayLabel: string;
    weekly: ReturnType<typeof getWeeklyHoursLines>;
    minutesUntilCutoff: number | null;
    /** True if we're inside published hours right now. */
    isOpen: boolean;
  };
  serverTime: string;
}

function buildHoursSummary(
  status: OpeningStatus,
): OrderingAvailability["hours"] {
  return {
    timezone: HOURS_TIMEZONE,
    lastOrderLeadMinutes: LAST_ORDER_LEAD_MINUTES,
    today: status.today,
    todayLabel: status.todayLabel,
    weekly: getWeeklyHoursLines(),
    minutesUntilCutoff: status.minutesUntilCutoff,
    isOpen: status.isOpen,
  };
}

export async function getOrderingAvailability(
  now: Date = new Date(),
): Promise<OrderingAvailability> {
  const pause: OrderingPauseState = await getOrderingPause();
  const hoursStatus = getOpeningStatus(now);
  const hours = buildHoursSummary(hoursStatus);
  const serverTime = now.toISOString();

  if (pause.paused) {
    const customMessage =
      pause.reason && pause.reason.length > 0
        ? `Online ordering is temporarily paused: ${pause.reason}`
        : "Online ordering is temporarily paused. Please check back shortly or call us to place an order.";
    return {
      accepting: false,
      reason: "paused",
      message: customMessage,
      staffPaused: true,
      staffPauseReason: pause.reason,
      staffPausedAt: pause.pausedAt,
      hours,
      serverTime,
    };
  }

  if (!hoursStatus.isAcceptingOrders) {
    return {
      accepting: false,
      reason: hoursStatus.reason,
      message: hoursStatus.message,
      staffPaused: false,
      hours,
      serverTime,
    };
  }

  return {
    accepting: true,
    staffPaused: false,
    hours,
    serverTime,
  };
}
