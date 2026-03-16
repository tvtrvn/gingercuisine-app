// This page is a client component because it has interactive search/filter
// and "Add to cart" buttons that talk to the shared cart context.
"use client";

import { useCart } from "@/components/cart/cart-context";
import { menuCategories, menuItems } from "@/data/menu";
import {
  AddonOption,
  DietaryTag,
  MenuCategoryId,
  MenuItem,
  SizeOption,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";


import { useMemo, useState } from "react";

const dietaryTagLabels: Record<DietaryTag, string> = {
  spicy: "Spicy",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
};

export default function MenuPage() {
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MenuCategoryId | "all">("all");
  const [tag, setTag] = useState<DietaryTag | "all">("all");
  const [selectedSizeByItem, setSelectedSizeByItem] = useState<
    Record<string, string>
  >({});
  const [selectedAddonsByItem, setSelectedAddonsByItem] = useState<
    Record<string, string[]>
  >({});

  function getSelectedSize(item: MenuItem): SizeOption | undefined {
    if (!item.availableSizes || item.availableSizes.length === 0) {
      return undefined;
    }
    const selectedSizeId =
      selectedSizeByItem[item.id] || item.defaultSizeId || item.availableSizes[0].id;
    return item.availableSizes.find((size) => size.id === selectedSizeId);
  }

  function getSelectedAddons(item: MenuItem): AddonOption[] {
    if (!item.availableAddons || item.availableAddons.length === 0) {
      return [];
    }
    const selectedAddonIds = selectedAddonsByItem[item.id] ?? [];
    return item.availableAddons.filter((addon) =>
      selectedAddonIds.includes(addon.id),
    );
  }

  function getDisplayPrice(item: MenuItem) {
    const sizeDelta = getSelectedSize(item)?.priceDelta ?? 0;
    const addonTotal = getSelectedAddons(item).reduce(
      (sum, addon) => sum + addon.price,
      0,
    );
    return item.price + sizeDelta + addonTotal;
  }

  function handleAddToCart(item: MenuItem) {
    addItem(item, {
      selectedSize: getSelectedSize(item),
      selectedAddons: getSelectedAddons(item),
    });
  }

  const filtered = useMemo(() => {
    return menuItems.filter((item) => {
      if (category !== "all" && item.categoryId !== category) return false;
      if (tag !== "all" && !item.tags?.includes(tag)) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.vietnameseName?.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [category, tag, search]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<MenuCategoryId, typeof filtered>();
    for (const item of filtered) {
      const arr = map.get(item.categoryId) ?? [];
      arr.push(item);
      map.set(item.categoryId, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Menu
        </h1>
        <p className="max-w-2xl text-sm text-neutral-700">
          Browse our full Vietnamese menu. Use search and filters to quickly
          find your favorite pho, bánh mì, vermicelli bowls, and more.
        </p>
      </header>

      {/* Filters */}
      <section
        aria-label="Menu filters"
        className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-3"
      >
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Search
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes or ingredients…"
            className="w-full rounded-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MenuCategoryId | "all")}
            className="w-full rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          >
            <option value="all">All categories</option>
            {menuCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Dietary
          </label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as DietaryTag | "all")}
            className="w-full rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          >
            <option value="all">Any</option>
            {Object.entries(dietaryTagLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Menu sections */}
      <section className="space-y-10">
        {menuCategories.map((cat) => {
          const items = itemsByCategory.get(cat.id);
          if (!items || items.length === 0) return null;

          return (
            <section key={cat.id} aria-label={cat.name} className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-xs text-neutral-600">{cat.description}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
                  >
                    <div className="hidden h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl sm:block">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-amber-100 via-emerald-50 to-rose-100" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900">
                            {item.name}
                          </h3>
                          {item.vietnameseName && (
                            <p className="text-xs text-emerald-700">
                              {item.vietnameseName}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {formatCurrency(getDisplayPrice(item))}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-neutral-600">
                        {item.description}
                      </p>
                      {item.availableSizes && item.availableSizes.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
                            Size
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.availableSizes.map((size) => {
                              const isSelected =
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
                                    isSelected
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
                        </div>
                      )}
                      {item.availableAddons && item.availableAddons.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
                            Add-ons
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.availableAddons.map((addon) => {
                              const selectedIds =
                                selectedAddonsByItem[item.id] ?? [];
                              const isSelected = selectedIds.includes(addon.id);
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
                                    isSelected
                                      ? "bg-amber-200 text-amber-900"
                                      : "bg-neutral-100 text-neutral-700"
                                  }`}
                                >
                                  {addon.name} (+{formatCurrency(addon.price)})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                          {item.tags?.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800"
                            >
                              {dietaryTagLabels[t]}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}

