"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  // Lazy initializer reads the real match synchronously on the client so the
  // first client render already agrees with the eventual value — no desktop
  // hydration flash of the mobile branch. SSR (no window) starts false; the
  // subscription effect corrects it after mount.
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
