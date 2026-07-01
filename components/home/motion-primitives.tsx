"use client";

import { domAnimation, LazyMotion, m, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * The ONLY file in the app that imports `motion/react`. Route-level code
 * splitting keeps it in the `/` bundle only — so it must never be imported by
 * `components/ui/*` (shared server components) or `app/(site)/layout.tsx`
 * (shared client chunk), which would leak motion into the 211-item menu and
 * the order path.
 *
 * `LazyMotion` + `domAnimation` ships only the DOM-animation feature bundle
 * (~18kb) instead of the full `motion.*` set (~34kb). `strict` forces `m.*`
 * (throws if anyone reaches for `motion.*`). `MotionConfig reducedMotion="user"`
 * snaps every animation to its end state for `prefers-reduced-motion` users.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

/**
 * Above-the-fold entrance for the hero. TRANSFORM ONLY (opacity stays 1) so the
 * LCP text/image paint on first frame — Chrome discounts opacity:0 elements for
 * LCP, so a fade here would hurt the score. `delay` staggers siblings.
 */
export function Rise({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={{ y: 14 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

/**
 * Scroll-triggered fade+rise, plays once. For BELOW-the-fold content only
 * (featured cards) — the opacity fade is fine there since it isn't the LCP
 * element.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
