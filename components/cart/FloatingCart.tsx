"use client";

import { useCart } from "@/components/cart/cart-context";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export function FloatingCart() {
  const { items, itemCount, subtotal, removeItem, lastAddedMessage } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      {lastAddedMessage && (
        <div className="fixed right-4 bottom-28 z-50 rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium text-white shadow-lg md:bottom-20">
          {lastAddedMessage}
        </div>
      )}

      <div className="fixed right-4 bottom-20 z-50 md:bottom-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 focus-visible:ring-offset-2"
          aria-label="Toggle cart"
        >
          Cart
          <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs">
            {itemCount}
          </span>
        </button>
      </div>

      {open && (
        <div className="fixed right-4 bottom-36 z-50 w-[min(92vw,24rem)] rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl md:bottom-22">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Your cart</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-neutral-600 hover:text-neutral-900"
            >
              Close
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-neutral-600">Your cart is empty.</p>
          ) : (
            <>
              <ul className="max-h-64 space-y-2 overflow-auto pr-1 text-xs">
                {items.map((item) => {
                  const unitPrice = item.unitPrice ?? item.price;
                  return (
                    <li
                      key={item.id}
                      className="rounded-xl border border-neutral-100 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {item.quantity} × {item.name}
                          </p>
                          {item.selectedSize && (
                            <p className="text-[11px] text-neutral-600">
                              Size: {item.selectedSize.label}
                            </p>
                          )}
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
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
                            className="text-[11px] text-red-600 hover:text-red-700"
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
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
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

