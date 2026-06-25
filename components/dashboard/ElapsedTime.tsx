"use client";

import { useEffect, useState } from "react";

function formatElapsed(ms: number): string {
  if (ms < 0) return "just now";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
}

export function ElapsedTime({ since }: { since: string }) {
  // Initialise as `null` so the SSR pass renders a stable placeholder. If we
  // seeded with `Date.now()` here, SSR and hydration would run a few ms apart
  // and any time the formatter straddles a second boundary (e.g. "0s" vs
  // "1s") React would log a hydration mismatch.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Intentional: start the client-only clock after mount. Seeding `now` in
    // useState would risk an SSR/hydration mismatch (see note above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return <span>just now</span>;
  }
  const elapsed = now - new Date(since).getTime();
  return <span>{formatElapsed(elapsed)}</span>;
}
