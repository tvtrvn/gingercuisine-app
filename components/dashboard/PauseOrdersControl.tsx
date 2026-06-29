"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface OrderingAvailabilityResponse {
  accepting: boolean;
  reason?: string;
  message?: string;
  staffPaused: boolean;
  staffPauseReason?: string;
  staffPausedAt?: string;
}

interface PauseOrdersControlProps {
  initialAvailability: OrderingAvailabilityResponse;
}

const MAX_REASON_LENGTH = 200;

/**
 * Staff-only toggle to pause / resume online ordering. Lives in the
 * dashboard top bar. While paused, customers see an amber banner on /order
 * and the submit button is disabled. The server-side `/api/order` POST
 * additionally rejects requests, so this is not a UI-only block.
 *
 * Polls every 30s + on focus so a second device (e.g. a manager's phone)
 * flipping the toggle is reflected on the kitchen tablet within seconds.
 */
export function PauseOrdersControl({
  initialAvailability,
}: PauseOrdersControlProps) {
  const [availability, setAvailability] =
    useState<OrderingAvailabilityResponse>(initialAvailability);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonInputRef = useRef<HTMLTextAreaElement | null>(null);
  // The button lives inside `<DashboardTopBar>`, whose `<header>` uses
  // `backdrop-blur-md`. CSS `backdrop-filter` creates a containing block for
  // descendant `fixed`-positioned elements, so without a portal the modal
  // anchors to the sticky header (≈200px tall) instead of the viewport and
  // gets cropped against the top. Mounting via `createPortal` to
  // `document.body` puts the modal back at the document root where
  // `fixed inset-0` actually means the full viewport.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Background sync.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/dashboard/orders/pause", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as OrderingAvailabilityResponse;
        if (!cancelled) setAvailability(data);
      } catch {
        // Silent — top bar shows a separate connectivity indicator.
      }
    }
    const id = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Auto-focus the reason field when the dialog opens.
  useEffect(() => {
    if (dialogOpen) {
      requestAnimationFrame(() => reasonInputRef.current?.focus());
    } else {
      setError(null);
    }
  }, [dialogOpen]);

  const submit = useCallback(
    async (next: { paused: boolean; reason?: string }) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/orders/pause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as OrderingAvailabilityResponse;
        setAvailability(data);
        setDialogOpen(false);
        setReasonDraft("");
      } catch (err) {
        console.error("[PauseOrdersControl] toggle failed:", err);
        setError("Couldn't update ordering status. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const isPaused = availability.staffPaused;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={isPaused ? "primary" : "outline"}
        onClick={() => {
          if (isPaused) {
            // Resume immediately — no need for a confirm dialog, the impact
            // is unambiguous and we want this to be a single tap on a busy
            // tablet.
            void submit({ paused: false });
          } else {
            setReasonDraft("");
            setDialogOpen(true);
          }
        }}
        disabled={isSubmitting}
        className={cn(
          isPaused &&
            "bg-amber-500 text-amber-950 hover:bg-amber-400 focus-visible:ring-amber-300",
        )}
        iconLeft={
          isPaused ? (
            <Play className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Pause className="h-3.5 w-3.5" aria-hidden />
          )
        }
      >
        {isPaused ? "Resume orders" : "Pause orders"}
      </Button>

      {dialogOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDialogOpen(false);
            }}
          >
            {/* Split layout: header (fixed) · body (scrolls if needed) ·
                footer (always pinned to the bottom of the dialog). This is
                what keeps the Pause / Cancel buttons visible on short
                viewports — the body shrinks before the footer ever does. */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pause-orders-title"
              className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl max-h-[min(34rem,calc(100dvh-1.5rem))] sm:max-h-[min(34rem,calc(100dvh-3rem))]"
            >
            <div className="flex items-start gap-3 px-5 pt-5 pb-3">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900"
              >
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <h2
                  id="pause-orders-title"
                  className="text-base font-semibold text-neutral-900"
                >
                  Pause incoming online orders?
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                  Customers will see a banner on the order page and the submit
                  button will be disabled. New orders will be rejected with the
                  reason below until you tap <strong>Resume orders</strong>.
                  Orders already in the kitchen are unaffected.
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
              <label
                htmlFor="pause-orders-reason"
                className="block text-xs font-semibold text-neutral-700"
              >
                Reason (optional, shown to customers)
              </label>
              <textarea
                id="pause-orders-reason"
                ref={reasonInputRef}
                rows={3}
                value={reasonDraft}
                onChange={(e) =>
                  setReasonDraft(e.target.value.slice(0, MAX_REASON_LENGTH))
                }
                placeholder="e.g. Kitchen is catching up — back in 20 minutes"
                className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                maxLength={MAX_REASON_LENGTH}
              />
              <p className="mt-1 text-right text-[11px] text-neutral-500">
                {reasonDraft.length} / {MAX_REASON_LENGTH}
              </p>

              {error && (
                <p
                  className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-100 bg-white px-5 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  void submit({
                    paused: true,
                    reason: reasonDraft.trim() || undefined,
                  })
                }
                loading={isSubmitting}
                className="bg-amber-500 text-amber-950 hover:bg-amber-400 focus-visible:ring-amber-300"
              >
                Pause online ordering
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

interface PauseOrdersBannerProps {
  initialAvailability: OrderingAvailabilityResponse;
}

/**
 * Full-width banner shown across the top of the dashboard whenever online
 * ordering is paused (either by staff or because we're outside hours). The
 * dashboard polls availability separately from the customer page so changes
 * propagate to all tablets within ~30s.
 */
export function OrderingStatusBanner({
  initialAvailability,
}: PauseOrdersBannerProps) {
  const [availability, setAvailability] =
    useState<OrderingAvailabilityResponse>(initialAvailability);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/dashboard/orders/pause", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as OrderingAvailabilityResponse;
        if (!cancelled) setAvailability(data);
      } catch {
        // ignore
      }
    }
    const id = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (availability.accepting) return null;
  const isPaused = availability.staffPaused;
  return (
    <div
      role="status"
      className={cn(
        "border-b px-4 py-2 text-xs font-semibold md:text-sm",
        isPaused
          ? "border-amber-300 bg-amber-100 text-amber-950"
          : "border-red-300 bg-red-100 text-red-950",
      )}
    >
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-2">
        <span>
          {isPaused
            ? "Online ordering is paused — customers cannot place new orders."
            : "Outside business hours — customers cannot place new orders."}
        </span>
        {availability.message && (
          <span className="font-medium text-current/80">{availability.message}</span>
        )}
      </div>
    </div>
  );
}
