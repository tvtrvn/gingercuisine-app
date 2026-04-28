"use client";

import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 3000;

/**
 * Same two-tone chime originally inline in OrderBoard.playChime.
 */
function fireChime(ctx: AudioContext) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1318, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch {
    // best-effort
  }
}

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const ctor =
    window.AudioContext ??
    (
      window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!ctor) return null;
  return new ctor();
}

function scheduleGestureFlag(set: (v: boolean) => void, value: boolean) {
  queueMicrotask(() => set(value));
}

export function useNewOrderAlarm(active: boolean): { needsGesture: boolean } {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gestureCleanupRef = useRef<(() => void) | null>(null);

  /** True while autoplay blocks sound until resume() runs from a gesture. */
  const [needsGesture, setNeedsGesture] = useState(false);

  useEffect(() => {
    const teardownInterval = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const removeGestureListeners = () => {
      gestureCleanupRef.current?.();
      gestureCleanupRef.current = null;
    };

    const attachResumeThenStart = (
      ctx: AudioContext,
      startLoop: () => void,
    ) => {
      removeGestureListeners();

      if (ctx.state === "running") {
        scheduleGestureFlag(setNeedsGesture, false);
        startLoop();
        return;
      }

      scheduleGestureFlag(setNeedsGesture, true);

      const tryResume = () => {
        void ctx.resume().then(() => {
          scheduleGestureFlag(setNeedsGesture, false);
          removeGestureListeners();
          startLoop();
        });
      };

      const opts = { capture: true, passive: true } as const;

      window.addEventListener("pointerdown", tryResume, opts);
      window.addEventListener("keydown", tryResume, opts);

      gestureCleanupRef.current = () => {
        window.removeEventListener("pointerdown", tryResume, opts);
        window.removeEventListener("keydown", tryResume, opts);
      };
    };

    if (!active) {
      teardownInterval();
      removeGestureListeners();
      scheduleGestureFlag(setNeedsGesture, false);
      return;
    }

    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    const startLoop = () => {
      teardownInterval();
      fireChime(ctx);
      intervalRef.current = setInterval(() => fireChime(ctx), INTERVAL_MS);
    };

    attachResumeThenStart(ctx, startLoop);

    return () => {
      teardownInterval();
      removeGestureListeners();
    };
  }, [active]);

  // Close AudioContext once when dashboard unmounts.
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      gestureCleanupRef.current?.();
      gestureCleanupRef.current = null;
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  return { needsGesture };
}
