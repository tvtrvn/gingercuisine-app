"use client";

import { useCart } from "@/components/cart/cart-context";
import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Hands-free "back to top" for the long menu (211+ items). Appears once the
 * user scrolls roughly a viewport down, and one press smoothly returns them to
 * the top. Lives bottom-LEFT so it never overlaps the cart FAB (bottom-right,
 * z-50) or its popover. CSS-only — deliberately no `motion` import to keep the
 * shared/menu/order bundles lean.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();

  // The mobile StickyOrderButton renders when the cart is empty off /order.
  // It shares the bottom edge with this button (bottom-4 vs bottom-20 left),
  // so suppress "back to top" while the order bar is up — one floater per
  // corner. On md+ the sticky bar is hidden and this button is welcome back.
  const stickyOrderBarVisible = itemCount === 0 && pathname !== "/order";

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setVisible(window.scrollY > 600);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function scrollToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      // Hidden from tab order + pointer when off-screen so it can't be focused
      // while invisible.
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-20 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-[var(--shadow-card-hover)] transition-all duration-200 hover:bg-neutral-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 md:bottom-6 ${
        stickyOrderBarVisible ? "max-md:hidden" : ""
      } ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
