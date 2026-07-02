"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/useScrollLock";

/**
 * Canonical modal shell. Every centered/blocking overlay should go through this
 * so the "photos bleed over the modal / page scrolls behind it" bug can't recur.
 *
 * Why a portal: a `position: fixed` element is trapped by any ancestor that
 * creates a stacking context or containing block — `isolation: isolate`, a
 * `transform` (e.g. a `motion` wrapper), or `backdrop-filter`. Inside such an
 * ancestor, `fixed inset-0` no longer means the viewport and `z-index` only
 * ranks locally, so later siblings paint on top. Mounting through
 * `createPortal(..., document.body)` puts the overlay back at the document root
 * where `fixed inset-0 z-[100]` covers the true viewport and sits above
 * everything. (Same rationale the dashboard PauseOrdersControl already relies on.)
 *
 * NOTE: lives in components/ui/* — must stay free of `motion/react` (see the
 * import guard in components/home/motion-primitives.tsx).
 */
export function ModalOverlay({
  open,
  onClose,
  labelledBy,
  panelClassName,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** id of the element that labels the dialog (for aria-labelledby). */
  labelledBy?: string;
  /** Override the panel width; defaults to a lightbox-friendly max-w-2xl. */
  panelClassName?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Move focus into the dialog on open; restore it to the trigger on close.
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => lastFocused.current?.focus?.();
  }, [open]);

  // `open` starts false and only flips on a client interaction, so the portal
  // is never reached during SSR/hydration — no `document` access on the server.
  if (!open) return null;

  return createPortal(
    <div
      data-testid="modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        data-testid="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative max-h-[90vh] w-full ${
          panelClassName ?? "max-w-2xl"
        } overflow-auto rounded-2xl bg-white shadow-2xl focus:outline-none`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
