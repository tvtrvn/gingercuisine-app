"use client";

import { useEffect } from "react";

/**
 * Locks body scroll while `active` is true and restores the previous overflow
 * on cleanup. Generalized from the one-off effect that used to live in
 * OrderPageClient so every overlay shares one implementation.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
