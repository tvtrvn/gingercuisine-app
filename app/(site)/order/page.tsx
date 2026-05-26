"use client";

import { useCart } from "@/components/cart/cart-context";
import { CartSummary } from "@/components/order/CartSummary";
import { OrderingAvailabilityBanner } from "@/components/order/OrderingAvailabilityBanner";
import { PickupForm } from "@/components/order/PickupForm";
import { RecentOrdersList } from "@/components/order/RecentOrdersList";
import { useOrderingAvailability } from "@/components/order/useOrderingAvailability";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { menuItems } from "@/data/menu";
import { PRICES_NOTICE } from "@/lib/config";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { AddonOption, MenuItem, SizeOption } from "@/lib/types";
import { computeUnitPrice } from "@/lib/pricing";
import { cn, formatCurrency } from "@/lib/utils";
import { ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function OrderPage() {
  const { addItem, checkoutSheetOpen, setCheckoutSheetOpen } = useCart();
  // Polled in the parent so the banner above the cart and the `PickupForm`'s
  // disabled state stay in sync. The /api/order POST is the authoritative
  // gate; this is just for instant UX feedback.
  const { availability } = useOrderingAvailability();
  const isLg = useMediaQuery("(min-width: 1024px)");
  const [selectedSizeByItem, setSelectedSizeByItem] = useState<
    Record<string, string>
  >({});
  const [selectedAddonsByItem, setSelectedAddonsByItem] = useState<
    Record<string, string[]>
  >({});
  const [selectedFlavorByItem, setSelectedFlavorByItem] = useState<
    Record<string, string>
  >({});
  const [notesByItem, setNotesByItem] = useState<Record<string, string>>({});

  function getNotes(item: MenuItem): string {
    return notesByItem[item.id] ?? "";
  }

  const featuredItems = useMemo(
    () => menuItems.filter((item) => item.isFeatured).slice(0, 8),
    [],
  );

  function getSelectedSize(item: MenuItem): SizeOption | undefined {
    if (!item.availableSizes || item.availableSizes.length === 0) return undefined;
    const selectedId =
      selectedSizeByItem[item.id] || item.defaultSizeId || item.availableSizes[0].id;
    return item.availableSizes.find((size) => size.id === selectedId);
  }

  function getSelectedAddons(item: MenuItem): AddonOption[] {
    if (!item.availableAddons || item.availableAddons.length === 0) return [];
    const selectedIds = selectedAddonsByItem[item.id] ?? [];
    return item.availableAddons.filter((addon) => selectedIds.includes(addon.id));
  }

  function getSelectedFlavor(item: MenuItem): AddonOption | undefined {
    if (!item.availableFlavors || item.availableFlavors.length === 0) return undefined;
    const flavorId = selectedFlavorByItem[item.id] || item.availableFlavors[0].id;
    return item.availableFlavors.find((f) => f.id === flavorId);
  }

  function handleAddToCart(item: MenuItem) {
    addItem(item, {
      selectedSize: getSelectedSize(item),
      selectedAddons: getSelectedAddons(item),
      selectedFlavor: getSelectedFlavor(item),
      notes: getNotes(item),
    });
    setNotesByItem((prev) => {
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  }

  useEffect(() => {
    if (isLg) setCheckoutSheetOpen(false);
  }, [isLg, setCheckoutSheetOpen]);

  useEffect(() => {
    if (!checkoutSheetOpen || isLg) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [checkoutSheetOpen, isLg]);

  return (
    <div className="space-y-8">
      {checkoutSheetOpen && !isLg && (
        <div
          className="fixed inset-0 z-[60] flex lg:hidden"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
            aria-label="Close checkout"
            onClick={() => setCheckoutSheetOpen(false)}
          />
          <div
            className="relative mt-auto flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-2xl transition-transform duration-200 ease-out"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-checkout-title"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h2
                id="mobile-checkout-title"
                className="text-base font-semibold text-neutral-900"
              >
                Checkout
              </h2>
              <IconButton
                aria-label="Close checkout"
                onClick={() => setCheckoutSheetOpen(false)}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pb-8">
              <OrderingAvailabilityBanner availability={availability} />
              <CartSummary />
              <PickupForm availability={availability} />
            </div>
          </div>
        </div>
      )}

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Order pickup
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
          Add dishes to your cart, review your order, and choose your pickup
          time. Payment is collected in person at the restaurant when you pick
          up your order.
        </p>
        <p className="max-w-2xl text-xs text-neutral-500">{PRICES_NOTICE}</p>
        <p className="text-xs text-neutral-600">
          Prefer to browse first?{" "}
          <Link
            href="/menu"
            className="font-semibold text-brand-700 transition-colors hover:text-brand-800"
          >
            View full menu
          </Link>
        </p>
      </header>

      <OrderingAvailabilityBanner availability={availability} />

      <RecentOrdersList />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1.4fr)]">
        <section
          aria-label="Popular items for quick ordering"
          className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold tracking-tight text-neutral-900">
              Popular dishes
            </h2>
            <Link
              href="/menu"
              className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
            >
              See full menu
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100 text-sm">
            {featuredItems.map((item, index) => (
              <li key={item.id} className="space-y-3 py-4 first:pt-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-200 bg-gradient-to-br from-brand-50 to-amber-50 shadow-sm sm:aspect-square sm:h-28 sm:w-28 sm:shrink-0"
                    aria-hidden={!item.image}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 7rem"
                        priority={index < 3}
                      />
                    ) : (
                      <div className="h-full w-full min-h-[10.5rem] bg-gradient-to-br from-amber-100 via-brand-50 to-rose-100 sm:min-h-0" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-neutral-900">{item.name}</p>
                        {item.vietnameseName && (
                          <p className="text-xs font-medium text-brand-800">
                            {item.vietnameseName}
                          </p>
                        )}
                        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                          {item.description}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900">
                        {formatCurrency(computeUnitPrice(item, getSelectedSize(item), getSelectedAddons(item), getSelectedFlavor(item)))}
                      </p>
                    </div>
                    {item.availableSizes && item.availableSizes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.availableSizes.map((size) => {
                          const selected =
                            (selectedSizeByItem[item.id] ||
                              item.defaultSizeId ||
                              item.availableSizes?.[0]?.id) === size.id;
                          return (
                            <button
                              key={size.id}
                              type="button"
                              onClick={() =>
                                setSelectedSizeByItem((prev) => ({
                                  ...prev,
                                  [item.id]: size.id,
                                }))
                              }
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                                selected
                                  ? "bg-brand-600 text-white"
                                  : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300",
                              )}
                            >
                              {size.label}
                              {size.priceDelta > 0
                                ? ` (+${formatCurrency(size.priceDelta)})`
                                : ""}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {item.availableFlavors && item.availableFlavors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.availableFlavors.map((flavor) => {
                          const selected =
                            (selectedFlavorByItem[item.id] ||
                              item.availableFlavors?.[0]?.id) === flavor.id;
                          return (
                            <button
                              key={flavor.id}
                              type="button"
                              onClick={() =>
                                setSelectedFlavorByItem((prev) => ({
                                  ...prev,
                                  [item.id]: flavor.id,
                                }))
                              }
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                                selected
                                  ? "bg-brand-600 text-white"
                                  : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300",
                              )}
                            >
                              {flavor.name}
                              {flavor.price > 0
                                ? ` (+${formatCurrency(flavor.price)})`
                                : ""}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {item.availableAddons && item.availableAddons.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.availableAddons.map((addon) => {
                          const selectedIds = selectedAddonsByItem[item.id] ?? [];
                          const selected = selectedIds.includes(addon.id);
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() =>
                                setSelectedAddonsByItem((prev) => {
                                  const current = prev[item.id] ?? [];
                                  const next = current.includes(addon.id)
                                    ? current.filter((id) => id !== addon.id)
                                    : [...current, addon.id];
                                  return { ...prev, [item.id]: next };
                                })
                              }
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                                selected
                                  ? "border border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
                                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-brand-200",
                              )}
                            >
                              {addon.name} (+{formatCurrency(addon.price)})
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor={`notes-featured-${item.id}`}
                        className="mb-1 block text-[11px] font-semibold text-neutral-600"
                      >
                        Notes (optional)
                      </label>
                      <textarea
                        id={`notes-featured-${item.id}`}
                        rows={2}
                        placeholder="e.g. allergies, no cilantro, light sauce"
                        value={notesByItem[item.id] ?? ""}
                        onChange={(e) =>
                          setNotesByItem((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        maxLength={300}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                      />
                    </div>
                    <div className="flex justify-end pt-1 sm:pt-0">
                      <Button
                        type="button"
                        size="md"
                        className="w-full sm:w-auto"
                        iconLeft={<ShoppingCart className="h-4 w-4" aria-hidden />}
                        onClick={() => handleAddToCart(item)}
                      >
                        Add to cart
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="checkout-area"
          aria-label="Your order and pickup details"
          className="scroll-mt-28 space-y-4 hidden lg:block"
        >
          <CartSummary />
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
            <PickupForm availability={availability} />
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-neutral-500 lg:hidden">
        Tap <strong>Cart</strong> below to review your order and enter pickup
        details.
      </p>
    </div>
  );
}
