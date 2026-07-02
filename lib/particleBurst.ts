/**
 * Positive-feedback particle burst: spawn a handful of small brand-colored dots
 * from the center of the clicked element and animate them outward, then remove
 * them. Purely cosmetic — no-op on the server, when the element is missing, or
 * when the user prefers reduced motion. Mirrors lib/flyToCart.ts (WAAPI, no deps).
 */
export function particleBurst(originEl: Element | null | undefined): void {
  if (typeof window === "undefined" || !originEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = originEl.getBoundingClientRect();
  if (rect.width === 0) return;

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const COUNT = 14;
  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed",
      left: `${cx}px`,
      top: `${cy}px`,
      width: "9px",
      height: "9px",
      borderRadius: "9999px",
      // theme-synced brand green (Tailwind v4 exposes theme colors as CSS vars).
      background: "var(--color-brand-600, #059669)",
      pointerEvents: "none",
      zIndex: "60",
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(dot);

    // fan out: alternate left/right, always upward, with per-dot randomness
    const dx = (i % 2 ? 1 : -1) * (Math.random() * 50 + 20);
    const dy = -(Math.random() * 50 + 20);

    const anim = dot.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`,
          opacity: 1,
          offset: 0.6,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`,
          opacity: 0,
        },
      ],
      { duration: 600, delay: i * 40, easing: "ease-out", fill: "forwards" },
    );

    const cleanup = () => dot.remove();
    anim.onfinish = cleanup;
    anim.oncancel = cleanup;
  }
}
