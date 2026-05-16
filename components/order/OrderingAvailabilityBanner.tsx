"use client";

import { Clock } from "lucide-react";
import type { OrderingAvailabilityResponse } from "./useOrderingAvailability";

interface OrderingAvailabilityBannerProps {
  availability: OrderingAvailabilityResponse | null;
}

/**
 * Top-of-page banner shown on /order when we can't accept orders. Renders
 * nothing while loading (the parent uses optimistic UI) and nothing when we
 * are accepting, so the banner reserves no space in the common case.
 *
 * Two flavors:
 *   - "paused"  — staff manually paused. Amber banner with optional reason.
 *   - hours     — outside business hours / past the last-order cutoff. Red banner
 *                 listing today's hours so customers know when to come back.
 */
export function OrderingAvailabilityBanner({
  availability,
}: OrderingAvailabilityBannerProps) {
  if (!availability || availability.accepting) return null;

  const isPaused = availability.reason === "paused";
  const palette = isPaused
    ? "border-amber-300 bg-amber-50 text-amber-950"
    : "border-red-300 bg-red-50 text-red-950";
  const iconPalette = isPaused ? "bg-amber-200/70" : "bg-red-200/70";
  const heading = isPaused
    ? "Online ordering paused"
    : availability.reason === "last_call"
      ? "We've stopped taking online orders for tonight"
      : "We're not accepting online orders right now";

  const todayWindow = availability.hours?.today;
  const todayLabel = availability.hours?.todayLabel;
  const weekly = availability.hours?.weekly ?? [];

  return (
    <section
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border ${palette} px-4 py-3 shadow-[var(--shadow-card)] sm:px-5 sm:py-4`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconPalette}`}
        >
          <Clock className="h-4 w-4" />
        </span>
        <div className="space-y-2">
          <p className="text-sm font-semibold sm:text-base">{heading}</p>
          {availability.message && (
            <p className="text-xs leading-relaxed sm:text-sm">
              {availability.message}
            </p>
          )}
          {!isPaused && todayWindow && todayLabel && (
            <p className="text-xs leading-relaxed sm:text-sm">
              Today ({todayLabel}) we&rsquo;re open from{" "}
              <strong>{formatHHMM(todayWindow.open)}</strong> to{" "}
              <strong>{formatHHMM(todayWindow.close)}</strong>.
            </p>
          )}
          {!isPaused && weekly.length > 0 && (
            <details className="text-xs sm:text-sm">
              <summary className="cursor-pointer font-medium underline-offset-2 hover:underline">
                See all hours
              </summary>
              <ul className="mt-2 space-y-0.5 tabular-nums">
                {weekly.map((line) => (
                  <li key={line.index} className="flex justify-between gap-3">
                    <span>{line.day}</span>
                    <span>{line.label}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}

function formatHHMM(value: string): string {
  const [hRaw, mRaw] = value.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return value;
  const period = h >= 12 && h < 24 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}
