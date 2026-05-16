"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shape returned by `/api/order/availability` (public) and the dashboard's
 * `/api/dashboard/orders/pause` (auth-gated). Both endpoints emit the same
 * payload so the two consumers can share this hook.
 */
export interface OrderingAvailabilityResponse {
  accepting: boolean;
  reason?:
    | "paused"
    | "before_hours"
    | "after_hours"
    | "closed_today"
    | "last_call";
  message?: string;
  staffPaused: boolean;
  staffPauseReason?: string;
  staffPausedAt?: string;
  hours: {
    timezone: string;
    lastOrderLeadMinutes: number;
    today: { open: string; close: string } | null;
    todayLabel: string;
    weekly: { index: number; day: string; label: string }[];
    minutesUntilCutoff: number | null;
    isOpen: boolean;
  } | null;
  serverTime: string;
  degraded?: boolean;
}

interface UseOrderingAvailabilityOptions {
  /** Endpoint to poll. Defaults to the public one. */
  url?: string;
  /** How often to revalidate, in ms. Defaults to 30s. */
  intervalMs?: number;
}

/**
 * Polls the ordering-availability endpoint and re-fetches on window focus.
 * Returns `null` until the first fetch completes, so callers can treat
 * unknown availability as "optimistic accepting" without flashing a banner
 * on first paint.
 */
export function useOrderingAvailability(
  options: UseOrderingAvailabilityOptions = {},
) {
  const url = options.url ?? "/api/order/availability";
  const intervalMs = options.intervalMs ?? 30_000;

  const [availability, setAvailability] =
    useState<OrderingAvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchAvailability = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as OrderingAvailabilityResponse;
      setAvailability(data);
      setError(null);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      console.error("[useOrderingAvailability] fetch failed:", err);
      setError("Could not check ordering availability.");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void fetchAvailability();
    const id = setInterval(() => {
      void fetchAvailability();
    }, intervalMs);
    const onFocus = () => {
      void fetchAvailability();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      abortRef.current?.abort();
    };
  }, [fetchAvailability, intervalMs]);

  return {
    availability,
    isLoading,
    error,
    refresh: fetchAvailability,
    setAvailability,
  };
}
