/**
 * Positive add-to-cart feedback: clone the dish image and animate it in an arc
 * ("jump") from the menu card into the floating cart button, then let the cart
 * bounce (see FloatingCart). Purely cosmetic — no-op on the server, when the
 * cart button isn't mounted, or when the user prefers reduced motion.
 */
export function flyToCart(sourceEl: Element | null | undefined): void {
  if (typeof window === "undefined" || !sourceEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const fab = document.querySelector("[data-cart-fab]");
  if (!fab) return;

  const start = sourceEl.getBoundingClientRect();
  const end = fab.getBoundingClientRect();
  if (start.width === 0 || end.width === 0) return;

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: "fixed",
    left: `${start.left}px`,
    top: `${start.top}px`,
    width: `${start.width}px`,
    height: `${start.height}px`,
    margin: "0",
    borderRadius: "9999px",
    objectFit: "cover",
    pointerEvents: "none",
    zIndex: "60",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(clone);

  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);

  const animation = clone.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      // mid-point lifts upward for a hop/arc before dropping into the cart
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(0.6)`,
        opacity: 0.9,
        offset: 0.5,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.1)`, opacity: 0.2 },
    ],
    { duration: 650, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
  );

  const cleanup = () => clone.remove();
  animation.onfinish = cleanup;
  animation.oncancel = cleanup;
}
