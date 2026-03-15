"use client";

import { useCart } from "@/components/cart/cart-context";
import { CartSummary } from "@/components/order/CartSummary";
import { PickupForm } from "@/components/order/PickupForm";
import { menuItems } from "@/data/menu";
import { AddonOption, MenuItem, SizeOption } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function OrderPage() {
  const { addItem } = useCart();
  const [selectedSizeByItem, setSelectedSizeByItem] = useState<
    Record<string, string>
  >({});
  const [selectedAddonsByItem, setSelectedAddonsByItem] = useState<
    Record<string, string[]>
  >({});

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

  function getDisplayPrice(item: MenuItem) {
    const sizeDelta = getSelectedSize(item)?.priceDelta ?? 0;
    const addonsTotal = getSelectedAddons(item).reduce(
      (sum, addon) => sum + addon.price,
      0,
    );
    return item.price + sizeDelta + addonsTotal;
  }

  function handleAddToCart(item: MenuItem) {
    addItem(item, {
      selectedSize: getSelectedSize(item),
      selectedAddons: getSelectedAddons(item),
    });
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Order pickup
        </h1>
        <p className="max-w-2xl text-sm text-neutral-700">
          Add dishes to your cart, review your order, and choose your pickup
          time. You can pay at pickup or use Stripe Checkout for card payments.
        </p>
        <p className="text-xs text-neutral-600">
          Prefer to browse first?{" "}
          <Link
            href="/menu"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            View full menu
          </Link>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1.4fr)]">
        {/* Menu shortlist on the left for quick adding */}
        <section
          aria-label="Popular items for quick ordering"
          className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
              Popular dishes
            </h2>
            <Link
              href="/menu"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              See full menu
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100 text-sm">
            {featuredItems.map((item) => (
              <li
                key={item.id}
                className="space-y-2 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    {item.vietnameseName && (
                      <p className="text-xs text-emerald-700">
                        {item.vietnameseName}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-600">
                      {item.description}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(getDisplayPrice(item))}
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
                          className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                            selected
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
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
                          className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                            selected
                              ? "bg-amber-200 text-amber-900"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {addon.name} (+{formatCurrency(addon.price)})
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    Add
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Cart + pickup form on the right */}
        <section
          id="checkout-area"
          aria-label="Your order and pickup details"
          className="scroll-mt-28 space-y-4"
        >
          <CartSummary />
          <PickupForm />
        </section>
      </div>
    </div>
  );
}

