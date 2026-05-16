/**
 * Restaurant opening hours and ordering-window helpers.
 *
 * The whole app evaluates "are we open right now?" in the restaurant's local
 * timezone (default `America/Toronto`) using a structured weekly schedule.
 * The public `RESTAURANT_HOURS` string shown on marketing pages is derived
 * from the same schedule so the website and the order gate can never drift
 * apart.
 *
 * Override knobs (all optional env vars):
 *   - `HOURS_TIMEZONE`        IANA TZ name. Defaults to `America/Toronto`.
 *   - `HOURS_SCHEDULE`        7-entry CSV of `HH:MM-HH:MM` or `closed`,
 *                             Monday→Sunday (e.g. `11:00-23:00,...,closed`).
 *                             Defaults to 11:00 AM – 11:00 PM every day.
 *   - `LAST_ORDER_LEAD_MIN`   Stop accepting new orders this many minutes
 *                             before close, so the kitchen has time to
 *                             finish. Defaults to 15.
 */

export const HOURS_TIMEZONE = process.env.HOURS_TIMEZONE || "America/Toronto";

/** Minutes before close that we stop accepting new orders. */
export const LAST_ORDER_LEAD_MINUTES = (() => {
  const raw = process.env.LAST_ORDER_LEAD_MIN;
  if (!raw) return 15;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 15;
})();

/** Monday-first ordering matches `Intl.DateTimeFormat({weekday})` formatting
 *  while still pinning a stable index for schedule lookups. */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<WeekdayIndex, string> = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

/** A single day's open window. `null` means closed all day. */
export interface DayWindow {
  /** "HH:MM" 24h, inclusive. */
  open: string;
  /** "HH:MM" 24h, exclusive. Use `"24:00"` to mean "until midnight". */
  close: string;
}

export type WeeklySchedule = Record<WeekdayIndex, DayWindow | null>;

const HHMM_RE = /^([01]\d|2[0-4]):([0-5]\d)$/;

function parseHHMM(value: string): number | null {
  const match = HHMM_RE.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h === 24 && m !== 0) return null;
  return h * 60 + m;
}

function formatHHMMToHuman(value: string): string {
  const mins = parseHHMM(value);
  if (mins === null) return value;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 && h < 24 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, "0");
  return `${hour12}:${mm} ${period}`;
}

function parseSchedule(raw: string | undefined): WeeklySchedule {
  const fallback: DayWindow = { open: "11:00", close: "23:00" };
  const blank: WeeklySchedule = {
    0: fallback,
    1: fallback,
    2: fallback,
    3: fallback,
    4: fallback,
    5: fallback,
    6: fallback,
  };
  if (!raw) return blank;

  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length !== 7) {
    console.warn(
      `[hours] HOURS_SCHEDULE has ${parts.length} entries, expected 7. Falling back to defaults.`,
    );
    return blank;
  }

  const out: Partial<WeeklySchedule> = {};
  for (let i = 0; i < 7; i++) {
    const idx = i as WeekdayIndex;
    const part = parts[i];
    if (!part || part.toLowerCase() === "closed") {
      out[idx] = null;
      continue;
    }
    const [openRaw, closeRaw] = part.split("-").map((s) => s?.trim());
    const openMins = openRaw ? parseHHMM(openRaw) : null;
    const closeMins = closeRaw ? parseHHMM(closeRaw) : null;
    if (
      openMins === null ||
      closeMins === null ||
      closeMins <= openMins
    ) {
      console.warn(
        `[hours] HOURS_SCHEDULE entry for ${WEEKDAY_LABELS[idx]} is invalid: "${part}". Falling back to default for that day.`,
      );
      out[idx] = fallback;
      continue;
    }
    out[idx] = { open: openRaw, close: closeRaw };
  }
  return out as WeeklySchedule;
}

export const WEEKLY_SCHEDULE: WeeklySchedule = parseSchedule(
  process.env.HOURS_SCHEDULE,
);

/** Pull `weekday`, `hour`, `minute` from a Date in the restaurant's TZ. */
function getLocalParts(date: Date): {
  weekday: WeekdayIndex;
  minutesIntoDay: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: HOURS_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const weekdayMap: Record<string, WeekdayIndex> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const weekday = weekdayMap[map.weekday ?? "Mon"] ?? 0;
  // `hour: "2-digit", hour12: false` returns "24" at midnight in some locales.
  // Normalize that back to 0 so comparisons work as expected.
  let h = Number(map.hour ?? "0");
  if (!Number.isFinite(h)) h = 0;
  if (h === 24) h = 0;
  const m = Number(map.minute ?? "0");
  return { weekday, minutesIntoDay: h * 60 + (Number.isFinite(m) ? m : 0) };
}

export interface OpeningStatus {
  /** Strictly within published hours (ignores `LAST_ORDER_LEAD_MINUTES`). */
  isOpen: boolean;
  /** Within hours AND outside the last-order lead window. */
  isAcceptingOrders: boolean;
  /** Customer-facing reason when ordering is not accepted. */
  reason?:
    | "before_hours"
    | "after_hours"
    | "closed_today"
    | "last_call";
  /** Customer-facing message paired with `reason`. */
  message?: string;
  /** Today's window in HH:MM (or null if closed). */
  today: DayWindow | null;
  /** Day label for `today` (e.g. "Monday"). */
  todayLabel: string;
  /** Minutes remaining until ordering cutoff if currently accepting; else null. */
  minutesUntilCutoff: number | null;
}

/**
 * Evaluate the opening status at a given instant. All comparisons are done in
 * the restaurant's local timezone via `Intl.DateTimeFormat`, so this is safe
 * to call from any server region.
 */
export function getOpeningStatus(now: Date = new Date()): OpeningStatus {
  const { weekday, minutesIntoDay } = getLocalParts(now);
  const window = WEEKLY_SCHEDULE[weekday];
  const todayLabel = WEEKDAY_LABELS[weekday];

  if (!window) {
    return {
      isOpen: false,
      isAcceptingOrders: false,
      reason: "closed_today",
      message: `We're closed today (${todayLabel}). Please come back during our regular hours.`,
      today: null,
      todayLabel,
      minutesUntilCutoff: null,
    };
  }

  const openMins = parseHHMM(window.open) ?? 0;
  const closeMins = parseHHMM(window.close) ?? 0;
  const cutoffMins = Math.max(openMins, closeMins - LAST_ORDER_LEAD_MINUTES);

  const isOpen = minutesIntoDay >= openMins && minutesIntoDay < closeMins;

  if (minutesIntoDay < openMins) {
    return {
      isOpen: false,
      isAcceptingOrders: false,
      reason: "before_hours",
      message: `We open at ${formatHHMMToHuman(window.open)} today. Please check back then.`,
      today: window,
      todayLabel,
      minutesUntilCutoff: null,
    };
  }

  if (minutesIntoDay >= closeMins) {
    return {
      isOpen: false,
      isAcceptingOrders: false,
      reason: "after_hours",
      message: `We're closed for the day. Today's hours were ${formatHHMMToHuman(window.open)} – ${formatHHMMToHuman(window.close)}.`,
      today: window,
      todayLabel,
      minutesUntilCutoff: null,
    };
  }

  if (minutesIntoDay >= cutoffMins) {
    return {
      isOpen,
      isAcceptingOrders: false,
      reason: "last_call",
      message: `We've stopped taking online orders for the night. Online orders close ${LAST_ORDER_LEAD_MINUTES} minutes before we close.`,
      today: window,
      todayLabel,
      minutesUntilCutoff: 0,
    };
  }

  return {
    isOpen: true,
    isAcceptingOrders: true,
    today: window,
    todayLabel,
    minutesUntilCutoff: cutoffMins - minutesIntoDay,
  };
}

/** Convenience boolean. */
export function isAcceptingOrdersByHours(now: Date = new Date()): boolean {
  return getOpeningStatus(now).isAcceptingOrders;
}

export interface WeeklyHoursLine {
  /** Schedule index (0=Mon … 6=Sun). */
  index: WeekdayIndex;
  day: string;
  label: string;
}

/**
 * Human-readable weekly hours, e.g. `[ { day: "Monday", label: "11:00 AM – 11:00 PM" }, … ]`.
 * Adjacent days that share the same window are NOT collapsed here — the order
 * page renders them as a list, and `RESTAURANT_HOURS` collapses identical
 * windows separately for the marketing copy.
 */
export function getWeeklyHoursLines(): WeeklyHoursLine[] {
  const out: WeeklyHoursLine[] = [];
  for (let i = 0; i < 7; i++) {
    const idx = i as WeekdayIndex;
    const win = WEEKLY_SCHEDULE[idx];
    out.push({
      index: idx,
      day: WEEKDAY_LABELS[idx],
      label: win
        ? `${formatHHMMToHuman(win.open)} – ${formatHHMMToHuman(win.close)}`
        : "Closed",
    });
  }
  return out;
}

/**
 * Compact summary string suitable for marketing copy / footer. Collapses
 * consecutive identical days. Examples:
 *   - All same: "Monday – Sunday: 11:00 AM – 11:00 PM"
 *   - Mixed: "Mon – Fri: 11:00 AM – 10:00 PM · Sat – Sun: 11:00 AM – 11:00 PM"
 */
export function formatRestaurantHoursSummary(): string {
  const lines = getWeeklyHoursLines();
  const groups: { start: WeekdayIndex; end: WeekdayIndex; label: string }[] = [];
  for (const line of lines) {
    const last = groups[groups.length - 1];
    if (last && last.label === line.label) {
      last.end = line.index;
    } else {
      groups.push({ start: line.index, end: line.index, label: line.label });
    }
  }
  return groups
    .map((g) => {
      const startLabel = WEEKDAY_LABELS[g.start];
      const endLabel = WEEKDAY_LABELS[g.end];
      const dayRange =
        g.start === g.end ? startLabel : `${startLabel} – ${endLabel}`;
      return `${dayRange}: ${g.label}`;
    })
    .join(" · ");
}
