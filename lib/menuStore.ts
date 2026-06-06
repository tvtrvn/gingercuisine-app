/**
 * Owner menu customizations layered on top of the hardcoded `data/menu.ts`
 * catalog. Stored as a single JSON document in the existing `RestaurantSetting`
 * key/value table (no schema migration), mirroring `lib/restaurantSettings.ts`.
 *
 * `getMenuItems()` is the single merge seam: every consumer (display pages and
 * server-side `priceCart`) reads the catalog through it so overrides and
 * sold-out flags are applied consistently. Reads are fail-open — a missing row
 * or a DB blip yields the plain hardcoded menu rather than an empty site.
 */

import { menuItems } from "@/data/menu";
import { prisma } from "./prisma";
import type { MenuItem } from "./types";

const MENU_CUSTOMIZATIONS_KEY = "menuCustomizations";

/** Owner edits to a single base item. All fields optional — only set keys win. */
export interface MenuOverride {
  available?: boolean;
  price?: number;
  name?: string;
  description?: string;
  /** Ids of size/add-on/flavor options on this item that are sold out. */
  soldOutOptionIds?: string[];
}

export interface MenuCustomizations {
  overrides: Record<string, MenuOverride>;
  customItems: MenuItem[];
}

function safeParse(raw: string): MenuCustomizations {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      const overrides =
        obj.overrides && typeof obj.overrides === "object"
          ? (obj.overrides as Record<string, MenuOverride>)
          : {};
      const customItems = Array.isArray(obj.customItems)
        ? (obj.customItems as MenuItem[])
        : [];
      return { overrides, customItems };
    }
  } catch {
    // fall through to empty
  }
  return { overrides: {}, customItems: [] };
}

export async function getMenuCustomizations(): Promise<MenuCustomizations> {
  try {
    const row = await prisma.restaurantSetting.findUnique({
      where: { key: MENU_CUSTOMIZATIONS_KEY },
    });
    if (!row) return { overrides: {}, customItems: [] };
    return safeParse(row.value);
  } catch (error) {
    // Fail open: a settings-collection blip shouldn't blank the menu.
    console.error("[menuStore] getMenuCustomizations failed:", error);
    return { overrides: {}, customItems: [] };
  }
}

/**
 * Apply one override to a base item, returning a NEW item. Option arrays in
 * `data/menu.ts` are shared constants reused across items, so we map into fresh
 * arrays and only clone the entries we flag — never mutate the originals.
 */
function mergeItem(item: MenuItem, override: MenuOverride | undefined): MenuItem {
  if (!override) return item;

  const merged: MenuItem = { ...item };
  if (override.price !== undefined) merged.price = override.price;
  if (override.name !== undefined) merged.name = override.name;
  if (override.description !== undefined) merged.description = override.description;
  if (override.available !== undefined) merged.available = override.available;

  const soldOutIds = new Set(override.soldOutOptionIds ?? []);
  if (soldOutIds.size > 0) {
    const flag = <T extends { id: string; soldOut?: boolean }>(o: T): T =>
      soldOutIds.has(o.id) ? { ...o, soldOut: true } : o;
    if (item.availableSizes) merged.availableSizes = item.availableSizes.map(flag);
    if (item.availableAddons) merged.availableAddons = item.availableAddons.map(flag);
    if (item.availableFlavors) merged.availableFlavors = item.availableFlavors.map(flag);
  }
  return merged;
}

/**
 * The full menu the rest of the app should render and price: base catalog with
 * owner overrides applied, followed by any owner-added custom items.
 */
export async function getMenuItems(): Promise<MenuItem[]> {
  const { overrides, customItems } = await getMenuCustomizations();
  const merged = menuItems.map((item) => mergeItem(item, overrides[item.id]));
  return [...merged, ...customItems];
}
