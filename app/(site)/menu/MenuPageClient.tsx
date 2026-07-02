// Client leaf for the menu page. The merged menu (base + owner overrides +
// custom items) is read on the server in `page.tsx` and passed in as `items`,
// so this stays a pure interactive component (search/filter/add-to-cart).
"use client";

import { useCart } from "@/components/cart/cart-context";
import { PaperMenuModal } from "@/components/ui/PaperMenuModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { menuCategories } from "@/data/menu";
import {
  AddonOption,
  DietaryTag,
  MenuCategoryId,
  MenuItem,
  SizeOption,
} from "@/lib/types";
import { computeUnitPrice } from "@/lib/pricing";
import { cn, formatCurrency } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { flyToCart } from "@/lib/flyToCart";
import { particleBurst } from "@/lib/particleBurst";

const dietaryTagLabels: Record<DietaryTag, string> = {
  spicy: "Spicy",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
};

export function MenuPageClient({ items: menuItems }: { items: MenuItem[] }) {
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
  const [selectedFlavorByItem, setSelectedFlavorByItem] = useState<
    Record<string, string>
  >({});
  const [notesByItem, setNotesByItem] = useState<Record<string, string>>({});

  function getNotes(item: MenuItem): string {
    return notesByItem[item.id] ?? "";
  }

  function getSelectedFlavor(item: MenuItem): AddonOption | undefined {
    if (!item.availableFlavors || item.availableFlavors.length === 0) {
      return undefined;
    }
    const explicitId = selectedFlavorByItem[item.id];
    if (explicitId) {
      return item.availableFlavors.find((f) => f.id === explicitId);
    }
    // Default to the first option that isn't sold out.
    return (
      item.availableFlavors.find((f) => !f.soldOut) ?? item.availableFlavors[0]
    );
  }

  function getSelectedSize(item: MenuItem): SizeOption | undefined {
    if (!item.availableSizes || item.availableSizes.length === 0) {
      return undefined;
    }
    const explicitId = selectedSizeByItem[item.id];
    if (explicitId) {
      return item.availableSizes.find((size) => size.id === explicitId);
    }
    // Prefer the configured default size, but skip it if it's sold out.
    const defaultSize = item.availableSizes.find(
      (size) => size.id === item.defaultSizeId,
    );
    if (defaultSize && !defaultSize.soldOut) return defaultSize;
    return (
      item.availableSizes.find((size) => !size.soldOut) ??
      item.availableSizes[0]
    );
  }

  function getSelectedAddons(item: MenuItem): AddonOption[] {
    if (!item.availableAddons || item.availableAddons.length === 0) {
      return [];
    }
    const selectedAddonIds = selectedAddonsByItem[item.id] ?? [];
    return item.availableAddons.filter(
      (addon) => selectedAddonIds.includes(addon.id) && !addon.soldOut,
    );
  }

  function handleAddToCart(
    item: MenuItem,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) {
    addItem(item, {
      selectedSize: getSelectedSize(item),
      selectedAddons: getSelectedAddons(item),
      selectedFlavor: getSelectedFlavor(item),
      notes: getNotes(item),
    });
    const card = event?.currentTarget.closest("[data-fly-card]");
    flyToCart(card?.querySelector("img"));
    particleBurst(event?.currentTarget);
    setNotesByItem((prev) => {
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
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
  }, [menuItems, category, tag, search]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<MenuCategoryId, typeof filtered>();
    for (const item of filtered) {
      const arr = map.get(item.categoryId) ?? [];
      arr.push(item);
      map.set(item.categoryId, arr);
    }
    return map;
  }, [filtered]);

  const visibleCategories = useMemo(
    () =>
      menuCategories.filter((c) => {
        const items = itemsByCategory.get(c.id);
        return items && items.length > 0;
      }),
    [itemsByCategory],
  );

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Menu
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
          Browse our full Vietnamese menu. Use search and filters to quickly
          find your favorite pho, bánh mì, vermicelli bowls, and more.
        </p>
        <PaperMenuModal />
      </header>

      {/* Filters */}
      <section
        aria-label="Menu filters"
        className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            type="search"
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes or ingredients…"
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as MenuCategoryId | "all")
            }
          >
            <option value="all">All categories</option>
            {menuCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <Select
            label="Dietary"
            value={tag}
            onChange={(e) => setTag(e.target.value as DietaryTag | "all")}
          >
            <option value="all">Any</option>
            {Object.entries(dietaryTagLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {/* Sticky category jump nav */}
      {visibleCategories.length > 1 && (
        <nav
          aria-label="Jump to category"
          className="sticky top-16 z-30 -mx-4 overflow-x-auto border-y border-neutral-200/80 bg-neutral-50/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 md:top-16"
        >
          <ul className="flex min-w-0 gap-2 pb-1">
            {visibleCategories.map((cat) => (
              <li key={cat.id} className="shrink-0">
                <a
                  href={`#cat-${cat.id}`}
                  className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900"
                >
                  {cat.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Menu sections */}
      <section className="space-y-14">
        {menuCategories.map((cat) => {
          const items = itemsByCategory.get(cat.id);
          if (!items || items.length === 0) return null;

          return (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              aria-label={cat.name}
              className="scroll-mt-36 space-y-5"
            >
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="mt-1 text-sm text-neutral-600">
                    {cat.description}
                  </p>
                )}
                {cat.availabilityNote && (
                  <p className="mt-2 text-xs italic text-neutral-500">
                    {cat.availabilityNote}
                  </p>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {items.map((item) => {
                  const itemSoldOut = item.available === false;
                  return (
                  <Card
                    key={item.id}
                    data-testid={`menu-card-${item.id}`}
                    data-fly-card
                    className="overflow-hidden hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <CardBody className="flex flex-col gap-4 p-0 sm:flex-row sm:gap-0">
                      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gradient-to-br from-brand-50 via-amber-50 to-rose-50 sm:aspect-square sm:w-44 sm:self-start lg:w-52">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className={cn(
                              "object-cover transition-transform duration-200 hover:scale-[1.02]",
                              itemSoldOut && "grayscale",
                            )}
                            sizes="(min-width:1024px) 13rem, (min-width:640px) 11rem, 100vw"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-neutral-900">
                                {item.name}
                              </h3>
                              {itemSoldOut && (
                                <Badge tone="danger">Sold out</Badge>
                              )}
                            </div>
                            {item.vietnameseName && (
                              <p className="text-xs font-medium text-brand-800">
                                {item.vietnameseName}
                              </p>
                            )}
                          </div>
                          <p className="shrink-0 text-base font-semibold tabular-nums text-neutral-900">
                            {formatCurrency(computeUnitPrice(item, getSelectedSize(item), getSelectedAddons(item), getSelectedFlavor(item)))}
                          </p>
                        </div>
                        <p className="text-xs leading-relaxed text-neutral-600 sm:text-sm">
                          {item.description}
                        </p>
                        {item.availableSizes &&
                          item.availableSizes.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                Size
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {item.availableSizes.map((size) => {
                                  const isSelected =
                                    getSelectedSize(item)?.id === size.id;
                                  return (
                                    <button
                                      key={size.id}
                                      type="button"
                                      disabled={size.soldOut}
                                      onClick={() =>
                                        setSelectedSizeByItem((prev) => ({
                                          ...prev,
                                          [item.id]: size.id,
                                        }))
                                      }
                                      className={cn(
                                        "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                                        size.soldOut
                                          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                                          : isSelected
                                            ? "border-brand-600 bg-brand-600 text-white"
                                            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300",
                                      )}
                                    >
                                      {size.label}
                                      {size.priceDelta > 0
                                        ? ` (+${formatCurrency(size.priceDelta)})`
                                        : ""}
                                      {size.soldOut ? " · Sold out" : ""}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        {item.availableFlavors &&
                          item.availableFlavors.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                Flavor
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {item.availableFlavors.map((flavor) => {
                                  const isSelected =
                                    getSelectedFlavor(item)?.id === flavor.id;
                                  return (
                                    <button
                                      key={flavor.id}
                                      type="button"
                                      disabled={flavor.soldOut}
                                      onClick={() =>
                                        setSelectedFlavorByItem((prev) => ({
                                          ...prev,
                                          [item.id]: flavor.id,
                                        }))
                                      }
                                      className={cn(
                                        "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                                        flavor.soldOut
                                          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                                          : isSelected
                                            ? "border-brand-600 bg-brand-600 text-white"
                                            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300",
                                      )}
                                    >
                                      {flavor.name}
                                      {flavor.price > 0
                                        ? ` (+${formatCurrency(flavor.price)})`
                                        : ""}
                                      {flavor.soldOut ? " · Sold out" : ""}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        {item.availableAddons &&
                          item.availableAddons.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                Add-ons
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {item.availableAddons.map((addon) => {
                                  const selectedIds =
                                    selectedAddonsByItem[item.id] ?? [];
                                  const isSelected =
                                    selectedIds.includes(addon.id) &&
                                    !addon.soldOut;
                                  return (
                                    <button
                                      key={addon.id}
                                      type="button"
                                      disabled={addon.soldOut}
                                      onClick={() =>
                                        setSelectedAddonsByItem((prev) => {
                                          const current = prev[item.id] ?? [];
                                          const next = current.includes(
                                            addon.id,
                                          )
                                            ? current.filter(
                                                (id) => id !== addon.id,
                                              )
                                            : [...current, addon.id];
                                          return { ...prev, [item.id]: next };
                                        })
                                      }
                                      className={cn(
                                        "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200",
                                        addon.soldOut
                                          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                                          : isSelected
                                            ? "border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-200"
                                            : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-200",
                                      )}
                                    >
                                      {addon.name} (+
                                      {formatCurrency(addon.price)})
                                      {addon.soldOut ? " · Sold out" : ""}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        <div>
                          <label
                            htmlFor={`notes-${item.id}`}
                            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500"
                          >
                            Notes (optional)
                          </label>
                          <textarea
                            id={`notes-${item.id}`}
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
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                          />
                        </div>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                          <div className="flex flex-wrap gap-1">
                            {item.tags?.map((t) => (
                              <Badge key={t} tone="success" className="text-[10px]">
                                {dietaryTagLabels[t]}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            type="button"
                            size="md"
                            disabled={itemSoldOut}
                            iconLeft={
                              <ShoppingCart className="h-4 w-4" aria-hidden />
                            }
                            onClick={(e) => handleAddToCart(item, e)}
                          >
                            {itemSoldOut ? "Sold out" : "Add to cart"}
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
