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

/**
 * One human-readable field change inside an override edit. `from`/`to` drive the
 * strike-through-old / bold-new rendering; `detail` carries changes that aren't a
 * clean old→new pair (e.g. which options went sold out).
 */
export interface MenuFieldChange {
  label: string;
  from?: string;
  to?: string;
  detail?: string;
}

export interface MenuAuditEntry {
  at: string; // ISO
  action: "override" | "add" | "edit" | "delete";
  itemId: string;
  /** Display name of the edited item. Set on `override`; absent on legacy
   * entries and on add/edit/delete (whose `summary` already names the item). */
  itemName?: string;
  summary: string;
  /**
   * Structured per-field changes for `override` entries. Absent on legacy
   * entries and on add/edit/delete — the UI falls back to `summary` then.
   */
  changes?: MenuFieldChange[];
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

/** Money for display: 8.95 → "$8.95". */
function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Two prices are "equal" if they round to the same cents (kills 8.95→8.95 noise). */
function samePrice(a: number, b: number): boolean {
  return a.toFixed(2) === b.toFixed(2);
}

function quote(s: string): string {
  return s.length ? `"${s}"` : "(empty)";
}

/** id → human label for every size/flavor/add-on option on a base item. */
function optionLabels(base: MenuItem | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of base?.availableSizes ?? []) map.set(s.id, s.label);
  for (const f of base?.availableFlavors ?? []) map.set(f.id, f.name);
  for (const a of base?.availableAddons ?? []) map.set(a.id, a.name);
  return map;
}

/** Ids of options the base catalog already ships as sold out. */
function baseSoldOutIds(base: MenuItem | undefined): string[] {
  const ids: string[] = [];
  for (const o of [
    ...(base?.availableSizes ?? []),
    ...(base?.availableFlavors ?? []),
    ...(base?.availableAddons ?? []),
  ]) {
    if (o.soldOut) ids.push(o.id);
  }
  return ids;
}

/**
 * Diff an incoming override `patch` against the item's EFFECTIVE current state
 * (the existing override value if set, otherwise the base catalog value) and
 * return only the fields that genuinely changed. Pure — no I/O — so it's unit
 * tested directly. An empty result means "nothing actually changed".
 *
 * The dashboard panel always submits all five fields seeded from the merged
 * item, so this is the single place that separates real edits from no-ops.
 */
export function diffOverride(
  base: MenuItem | undefined,
  prev: MenuOverride,
  patch: MenuOverride,
): MenuFieldChange[] {
  const changes: MenuFieldChange[] = [];

  if (patch.available !== undefined) {
    const prevAvail = prev.available ?? (base ? base.available !== false : true);
    if (patch.available !== prevAvail) {
      changes.push({
        label: "Availability",
        from: prevAvail ? "Available" : "Sold out",
        to: patch.available ? "Available" : "Sold out",
      });
    }
  }

  if (patch.price !== undefined) {
    const prevPrice = prev.price ?? base?.price;
    if (prevPrice === undefined || !samePrice(prevPrice, patch.price)) {
      changes.push({
        label: "Price",
        from: prevPrice === undefined ? undefined : money(prevPrice),
        to: money(patch.price),
      });
    }
  }

  if (patch.name !== undefined) {
    const prevName = prev.name ?? base?.name ?? "";
    if (patch.name !== prevName) {
      changes.push({ label: "Name", from: quote(prevName), to: quote(patch.name) });
    }
  }

  if (patch.description !== undefined) {
    const prevDesc = prev.description ?? base?.description ?? "";
    if (patch.description !== prevDesc) {
      changes.push({
        label: "Description",
        from: quote(prevDesc),
        to: quote(patch.description),
      });
    }
  }

  if (patch.soldOutOptionIds !== undefined) {
    const prevIds = new Set(prev.soldOutOptionIds ?? baseSoldOutIds(base));
    const nextIds = new Set(patch.soldOutOptionIds);
    const labels = optionLabels(base);
    const name = (id: string) => labels.get(id) ?? id;
    const added = [...nextIds].filter((id) => !prevIds.has(id)).map(name);
    const removed = [...prevIds].filter((id) => !nextIds.has(id)).map(name);
    if (added.length) {
      changes.push({ label: "Options sold out", detail: added.join(", ") });
    }
    if (removed.length) {
      changes.push({ label: "Options back in stock", detail: removed.join(", ") });
    }
  }

  return changes;
}

/** Collapse structured changes into the one-line `summary` string. */
export function summarizeChanges(changes: MenuFieldChange[]): string {
  return changes
    .map((c) => {
      if (c.from !== undefined && c.to !== undefined) return `${c.label} ${c.from} → ${c.to}`;
      if (c.detail !== undefined) return `${c.label}: ${c.detail}`;
      if (c.to !== undefined) return `${c.label} ${c.to}`;
      return c.label;
    })
    .join(", ");
}

export async function upsertOverride(
  itemId: string,
  patch: MenuOverride,
  actor: string,
): Promise<void> {
  const current = await getMenuCustomizations();
  const base = baseById.get(itemId);
  const prev = current.overrides[itemId] ?? {};
  const changes = diffOverride(base, prev, patch);
  current.overrides[itemId] = { ...prev, ...patch };
  await writeCustomizations(current);
  // A genuine no-op save (panel opened and saved unchanged) leaves no log noise.
  if (changes.length === 0) return;
  await appendMenuAudit({
    action: "override",
    itemId,
    itemName: patch.name ?? prev.name ?? base?.name ?? itemId,
    summary: summarizeChanges(changes),
    changes,
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
