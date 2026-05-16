"use client";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { LogOut, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { PauseOrdersControl } from "./PauseOrdersControl";

interface InitialAvailability {
  accepting: boolean;
  reason?: string;
  message?: string;
  staffPaused: boolean;
  staffPauseReason?: string;
  staffPausedAt?: string;
}

export function DashboardTopBar({
  restaurantName,
  counts,
  lastFetchAt,
  isFetching,
  fetchError,
  onRefresh,
  soundMuted,
  onToggleSound,
  needsGesture,
  newCount,
  initialAvailability,
}: {
  restaurantName: string;
  counts: { new: number; acknowledged: number; ready: number };
  /** `null` until the first poll lands — keeps SSR/CSR markup identical. */
  lastFetchAt: string | null;
  isFetching: boolean;
  fetchError: string | null;
  onRefresh: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  needsGesture: boolean;
  newCount: number;
  initialAvailability: InitialAvailability;
}) {
  async function handleLogout() {
    await fetch("/api/dashboard/logout", { method: "POST" });
    window.location.href = "/dashboard/login";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="space-y-4 px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-700">
              Operations
            </p>
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 md:text-xl">
              {restaurantName}
            </h1>
            <p className="mt-0.5 text-xs text-neutral-500">
              Online pickup · Pay in person
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IconButton
              type="button"
              aria-label={soundMuted ? "Unmute new-order sound" : "Mute new-order sound"}
              onClick={onToggleSound}
              className={cn(soundMuted && "bg-neutral-100")}
            >
              {soundMuted ? (
                <VolumeX className="h-4 w-4" aria-hidden />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden />
              )}
            </IconButton>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
              iconLeft={
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                  aria-hidden
                />
              }
            >
              Refresh
            </Button>
            <PauseOrdersControl initialAvailability={initialAvailability} />
            <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
              <span className="inline-flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2.5 text-center sm:px-4 sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-800 sm:text-xs">
              New
            </p>
            <p className="text-xl font-bold tabular-nums text-blue-950 sm:text-2xl">
              {counts.new}
            </p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2.5 text-center sm:px-4 sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-800 sm:text-xs">
              Acknowledged
            </p>
            <p className="text-xl font-bold tabular-nums text-violet-950 sm:text-2xl">
              {counts.acknowledged}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-center sm:px-4 sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 sm:text-xs">
              Ready
            </p>
            <p className="text-xl font-bold tabular-nums text-emerald-950 sm:text-2xl">
              {counts.ready}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              fetchError
                ? "bg-red-500"
                : isFetching
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500",
            )}
            aria-hidden
          />
          <span>
            Last sync{" "}
            {lastFetchAt ? (
              <time dateTime={lastFetchAt}>
                {new Date(lastFetchAt).toLocaleTimeString()}
              </time>
            ) : (
              <span aria-live="polite">—</span>
            )}
          </span>
          {fetchError && (
            <span className="font-medium text-red-600">{fetchError}</span>
          )}
        </div>

        {needsGesture && newCount > 0 && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            Tap anywhere on the page to enable new-order sound.
          </p>
        )}
      </div>
    </header>
  );
}
