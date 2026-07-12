"use client";

import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { formatCurrency } from "@/lib/utils";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function FloatingCart() {
  const pathname = usePathname();
  const isOrderPage = pathname === "/order";
  const isLg = useMediaQuery("(min-width: 1024px)");
  const {
    items,
    itemCount,
    subtotal,
    removeItem,
    lastAddedMessage,
    setCheckoutSheetOpen,
  } = useCart();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const prevItemCountRef = useRef(itemCount);

  const showMobileCheckoutSheet = isOrderPage && !isLg;

  // The mobile StickyOrderButton (bottom-4, md:hidden) renders under the exact
  // same condition. When it's up, lift the FAB above it so the two never stack
  // in the bottom-right corner (one floater per corner). On md+ the sticky bar
  // is hidden, so keep the tighter offset.
  const stickyOrderBarVisible = itemCount === 0 && !isOrderPage;

  useEffect(() => {
    if (isLg) setCheckoutSheetOpen(false);
  }, [isLg, setCheckoutSheetOpen]);

  // Bounce the cart button when an item lands in it (paired with flyToCart's
  // ~650ms arc, so the bounce reads as the item dropping in).
  useEffect(() => {
    const grew = itemCount > prevItemCountRef.current;
    prevItemCountRef.current = itemCount;
    if (!grew) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fab = document.querySelector("[data-cart-fab]");
    if (!fab) return;
    const timer = window.setTimeout(() => {
      fab.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.18)" },
          { transform: "scale(0.94)" },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "ease-out" },
      );
    }, 480);
    return () => window.clearTimeout(timer);
  }, [itemCount]);

  function handleFabClick() {
    if (showMobileCheckoutSheet) {
      setCheckoutSheetOpen(true);
      setPopoverOpen(false);
      return;
    }
    setPopoverOpen((v) => !v);
  }

  return (
    <>
      {lastAddedMessage && (
        <div
          className={`fixed right-4 z-50 max-w-[min(92vw,20rem)] rounded-xl border border-brand-600/20 bg-brand-700 px-4 py-2.5 text-xs font-medium text-white shadow-lg md:bottom-20 ${
            stickyOrderBarVisible ? "bottom-44" : "bottom-28"
          }`}
          role="status"
        >
          {lastAddedMessage}
        </div>
      )}

      <div
        className={`fixed right-4 z-50 md:bottom-6 ${
          stickyOrderBarVisible ? "bottom-32" : "bottom-20"
        }`}
      >
        <Button
          type="button"
          variant="primary"
          size="md"
          pill
          iconLeft={<ShoppingBag className="h-4 w-4" aria-hidden />}
          onClick={handleFabClick}
          data-cart-fab
          className="shadow-lg shadow-neutral-900/15"
          aria-label={
            showMobileCheckoutSheet
              ? "Open checkout"
              : popoverOpen
                ? "Close cart"
                : "Open cart"
          }
        >
          Cart
          {itemCount > 0 && (
            <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums">
              {itemCount}
            </span>
          )}
        </Button>
      </div>

      {popoverOpen && !showMobileCheckoutSheet && (
        <div
          className={`fixed right-4 z-50 w-[min(92vw,24rem)] rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl md:bottom-24 ${
            stickyOrderBarVisible ? "bottom-48" : "bottom-36"
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">Your cart</h3>
            <IconButton
              aria-label="Close cart"
              onClick={() => setPopoverOpen(false)}
              className="h-9 w-9 border-0 shadow-none"
            >
              <X className="h-4 w-4" />
            </IconButton>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-neutral-600">Your cart is empty.</p>
          ) : (
            <>
              <ul className="max-h-64 space-y-2 overflow-auto pr-1 text-xs">
                {items.map((item) => {
                  const unitPrice = item.unitPrice ?? item.price;
                  return (
                    <li
                      key={item.id}
                      className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {item.quantity} × {item.name}
                          </p>
                          {item.selectedFlavor && (
                            <p className="text-[11px] text-neutral-600">
                              Flavor: {item.selectedFlavor.name}
                            </p>
                          )}
                          {item.selectedSize && (
                            <p className="text-[11px] text-neutral-600">
                              Size: {item.selectedSize.label}
                            </p>
                          )}
                          {item.selectedAddons &&
                            item.selectedAddons.length > 0 && (
                              <p className="text-[11px] text-neutral-600">
                                Add-ons:{" "}
                                {item.selectedAddons
                                  .map((addon) => addon.name)
                                  .join(", ")}
                              </p>
                            )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-neutral-900">
                            {formatCurrency(unitPrice * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-[11px] font-medium text-red-600 transition-colors hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm font-semibold text-neutral-900">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <Link
                href="/order#checkout-area"
                onClick={() => setPopoverOpen(false)}
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Go to checkout
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
