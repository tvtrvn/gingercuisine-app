"use client";

import { useEffect, useRef, useState } from "react";

/** Custom chime audio file, served from public/sounds/. */
const SOUND_URL = "/sounds/new-order.mp3";
/**
 * Re-fire cadence. The clip is ~2s with a quiet tail, so we restart it every
 * 1s — staff hear only the loud opening, repeated, until they acknowledge.
 */
const INTERVAL_MS = 1500;
/** Playback gain. 1 = file's recorded level; raise toward ~2 for more, but >1 risks clipping. */
const VOLUME = 2.0;

/** Live source node, so each re-fire can stop the previous clip before replaying. */
type SourceRef = { current: AudioBufferSourceNode | null };

/**
 * Plays the decoded custom chime once through the shared AudioContext. Stops
 * any still-playing instance first so the 1s re-fire restarts cleanly (cutting
 * the clip's quiet tail) instead of overlapping.
 */
function fireChime(ctx: AudioContext, buffer: AudioBuffer, sourceRef: SourceRef) {
  try {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // already stopped
      }
      sourceRef.current = null;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = VOLUME;
    src.connect(gain).connect(ctx.destination);
    src.start();
    sourceRef.current = src;
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
  const bufferRef = useRef<AudioBuffer | null>(null);
  const loadingRef = useRef<Promise<AudioBuffer | null> | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  /** True while autoplay blocks sound until resume() runs from a gesture. */
  const [needsGesture, setNeedsGesture] = useState(false);

  useEffect(() => {
    /** Fetch + decode the chime once; retries on next tick if it fails. */
    const ensureBuffer = (ctx: AudioContext): Promise<AudioBuffer | null> => {
      if (bufferRef.current) return Promise.resolve(bufferRef.current);
      if (!loadingRef.current) {
        loadingRef.current = (async () => {
          try {
            const res = await fetch(SOUND_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.arrayBuffer();
            const buf = await ctx.decodeAudioData(data);
            bufferRef.current = buf;
            return buf;
          } catch {
            loadingRef.current = null; // allow retry on a later tick
            return null;
          }
        })();
      }
      return loadingRef.current;
    };

    const stopSource = () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // already stopped
        }
        sourceRef.current = null;
      }
    };

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
      stopSource();
      removeGestureListeners();
      scheduleGestureFlag(setNeedsGesture, false);
      return;
    }

    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Each tick loads the clip if needed (built-in retry) then plays it.
    const tick = () => {
      void ensureBuffer(ctx).then((buf) => {
        if (buf) fireChime(ctx, buf, sourceRef);
      });
    };

    const startLoop = () => {
      teardownInterval();
      tick();
      intervalRef.current = setInterval(tick, INTERVAL_MS);
    };

    attachResumeThenStart(ctx, startLoop);

    return () => {
      teardownInterval();
      stopSource();
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
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // already stopped
        }
        sourceRef.current = null;
      }
      gestureCleanupRef.current?.();
      gestureCleanupRef.current = null;
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  return { needsGesture };
}
