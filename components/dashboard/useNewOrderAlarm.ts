"use client";

import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 2500;

/**
 * Loud three-beep alert chime. A square wave at high gain is perceptually much
 * louder than the old sine tone and cuts through kitchen noise — staff reported
 * the previous chime was too quiet to hear. Loops while any order is
 * unacknowledged (see the hook below).
 */
function fireChime(ctx: AudioContext) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    const t0 = ctx.currentTime;
    const PEAK = 0.6; // vs 0.25 before — louder, still below clipping
    // Rising three-beep burst (B5 → E6 → G6).
    const beeps = [
      { f: 988, start: 0.0 },
      { f: 1319, start: 0.18 },
      { f: 1568, start: 0.36 },
    ];
    gain.gain.setValueAtTime(0.0001, t0);
    for (const b of beeps) {
      osc.frequency.setValueAtTime(b.f, t0 + b.start);
      gain.gain.setValueAtTime(0.0001, t0 + b.start);
      gain.gain.exponentialRampToValueAtTime(PEAK, t0 + b.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + b.start + 0.14);
    }
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.52);
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
