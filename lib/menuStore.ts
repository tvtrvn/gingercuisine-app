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

import { randomUUID } from "node:crypto";
import { menuItems } from "@/data/menu";
import { prisma } from "./prisma";
import type { MenuItem } from "./types";

const MENU_CUSTOMIZATIONS_KEY = "menuCustomizations";
const MENU_AUDIT_KEY = "menuAuditLog";
const AUDIT_CAP = 200;

const baseById = new Map<string, MenuItem>(menuItems.map((m) => [m.id, m]));

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

// ---- Mutations (owner dashboard) ----
//
// Each mutation is a read-modify-write on the single customizations document.
// Dashboard writes are low-frequency and single-owner, so the lack of a true
// atomic update is acceptable — same tradeoff as `setOrderingPause`. Every
// mutation also appends a capped audit entry so changes are traceable without
// a developer reading the DB.

export type CustomItemFields = Omit<MenuItem, "id">;

export interface MenuAuditEntry {
  at: string; // ISO
  action: "override" | "add" | "edit" | "delete";
  itemId: string;
  summary: string;
  actor: string; // hashed dashboard-session key (never a raw token)
}

async function writeCustomizations(next: MenuCustomizations): Promise<void> {
  const payload = JSON.stringify(next);
  await prisma.restaurantSetting.upsert({
    where: { key: MENU_CUSTOMIZATIONS_KEY },
    create: { key: MENU_CUSTOMIZATIONS_KEY, value: payload },
    update: { value: payload },
  });
}

export async function getMenuAuditLog(): Promise<MenuAuditEntry[]> {
  try {
    const row = await prisma.restaurantSetting.findUnique({
      where: { key: MENU_AUDIT_KEY },
    });
    if (!row) return [];
    const parsed = JSON.parse(row.value) as unknown;
    return Array.isArray(parsed) ? (parsed as MenuAuditEntry[]) : [];
  } catch (error) {
    console.error("[menuStore] getMenuAuditLog failed:", error);
    return [];
  }
}

async function appendMenuAudit(
  entry: Omit<MenuAuditEntry, "at">,
): Promise<void> {
  try {
    const log = await getMenuAuditLog();
    log.push({ ...entry, at: new Date().toISOString() });
    const payload = JSON.stringify(log.slice(-AUDIT_CAP));
    await prisma.restaurantSetting.upsert({
      where: { key: MENU_AUDIT_KEY },
      create: { key: MENU_AUDIT_KEY, value: payload },
      update: { value: payload },
    });
  } catch (error) {
    // Audit is best-effort: never let a logging failure block the actual edit.
    console.error("[menuStore] appendMenuAudit failed:", error);
  }
}

function summarizeOverride(
  base: MenuItem | undefined,
  prev: MenuOverride,
  patch: MenuOverride,
): string {
  const parts: string[] = [];
  if (patch.available !== undefined) {
    parts.push(patch.available ? "marked available" : "marked sold out");
  }
  if (patch.price !== undefined) {
    const old = prev.price ?? base?.price;
    parts.push(`price ${old ?? "?"}→${patch.price}`);
  }
  if (patch.name !== undefined) parts.push("renamed");
  if (patch.description !== undefined) parts.push("description edited");
  if (patch.soldOutOptionIds !== undefined) {
    parts.push(`${patch.soldOutOptionIds.length} sold-out option(s)`);
  }
  return parts.length ? parts.join(", ") : "override updated";
}

export async function upsertOverride(
  itemId: string,
  patch: MenuOverride,
  actor: string,
): Promise<void> {
  const current = await getMenuCustomizations();
  const prev = current.overrides[itemId] ?? {};
  current.overrides[itemId] = { ...prev, ...patch };
  await writeCustomizations(current);
  await appendMenuAudit({
    action: "override",
    itemId,
    summary: summarizeOverride(baseById.get(itemId), prev, patch),
    actor,
  });
}

export async function addCustomItem(
  fields: CustomItemFields,
  actor: string,
): Promise<MenuItem> {
  const current = await getMenuCustomizations();
  const item: MenuItem = { ...fields, id: `custom-${randomUUID()}` };
  current.customItems.push(item);
  await writeCustomizations(current);
  await appendMenuAudit({
    action: "add",
    itemId: item.id,
    summary: `added "${item.name}"`,
    actor,
  });
  return item;
}

export async function updateCustomItem(
  id: string,
  fields: CustomItemFields,
  actor: string,
): Promise<{ updated: MenuItem; previousImage?: string } | null> {
  const current = await getMenuCustomizations();
  const idx = current.customItems.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const previousImage = current.customItems[idx].image;
  const updated: MenuItem = { ...fields, id };
  current.customItems[idx] = updated;
  await writeCustomizations(current);
  await appendMenuAudit({
    action: "edit",
    itemId: id,
    summary: `edited "${updated.name}"`,
    actor,
  });
  return { updated, previousImage };
}

export async function deleteCustomItem(
  id: string,
  actor: string,
): Promise<MenuItem | null> {
  const current = await getMenuCustomizations();
  const idx = current.customItems.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const [removed] = current.customItems.splice(idx, 1);
  await writeCustomizations(current);
  await appendMenuAudit({
    action: "delete",
    itemId: id,
    summary: `deleted "${removed.name}"`,
    actor,
  });
  return removed;
}
