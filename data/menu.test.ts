import { describe, it, expect } from "vitest";
import { menuItems, menuCategories, MENU_IMAGES } from "@/data/menu";

/**
 * Integrity checks over the REAL hardcoded catalog. The owner-edit path is
 * validated by `customItemSchema` (lib/validation.ts), but nothing guards the
 * static `data/menu.ts` array — a bad hand-edit ships silently. These two are
 * the dangerous ones:
 *   - a duplicate id silently shadows an item in the priceCart/menuStore Maps;
 *   - a `defaultSizeId` not in `availableSizes` makes every no-size order of
 *     that item throw at checkout AND mis-keys the default-base pricing rule,
 *     systematically overcharging.
 */
describe("menu data integrity", () => {
  const ids = menuItems.map((m) => m.id);
  const idSet = new Set(ids);
  const categoryIds = new Set(menuCategories.map((c) => c.id));

  it("has no duplicate item ids", () => {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("every defaultSizeId exists in that item's availableSizes", () => {
    const offenders = menuItems
      .filter((m) => m.defaultSizeId)
      .filter(
        (m) =>
          !(m.availableSizes ?? []).some((s) => s.id === m.defaultSizeId),
      )
      .map((m) => `${m.id} -> ${m.defaultSizeId}`);
    expect(offenders).toEqual([]);
  });

  it("option ids are unique within each item (sizes / addons / flavors)", () => {
    const offenders: string[] = [];
    for (const m of menuItems) {
      for (const [kind, opts] of [
        ["size", m.availableSizes],
        ["addon", m.availableAddons],
        ["flavor", m.availableFlavors],
      ] as const) {
        const optIds = (opts ?? []).map((o) => o.id);
        const dup = optIds.filter((id, i) => optIds.indexOf(id) !== i);
        if (dup.length) offenders.push(`${m.id} ${kind}: ${dup.join(",")}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every item's categoryId is a real category", () => {
    const offenders = menuItems
      .filter((m) => !categoryIds.has(m.categoryId))
      .map((m) => `${m.id} -> ${m.categoryId}`);
    expect(offenders).toEqual([]);
  });

  it("every MENU_IMAGES key maps to a real item id (no orphaned photos)", () => {
    const orphans = Object.keys(MENU_IMAGES).filter((k) => !idSet.has(k));
    expect(orphans).toEqual([]);
  });
});
