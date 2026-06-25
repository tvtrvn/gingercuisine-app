import { describe, it, expect } from "vitest";
import type { MenuItem } from "@/lib/types";
import {
  diffOverride,
  summarizeChanges,
  type MenuOverride,
} from "@/lib/menuStore";

function makeItem(opts?: Partial<MenuItem>): MenuItem {
  return {
    id: "pho-beef",
    categoryId: "pho",
    name: "Classic Beef Pho",
    description: "Rice noodles in beef broth.",
    price: 8.95,
    ...opts,
  };
}

const base = makeItem({
  availableSizes: [
    { id: "small", label: "Small", priceDelta: 0 },
    { id: "large", label: "Large", priceDelta: 2 },
  ],
  availableAddons: [{ id: "extra-beef", name: "Extra beef", price: 3 }],
});

// The dashboard panel always submits all five fields, seeded from the merged
// item — so a "no change" save resends today's values verbatim.
const unchangedPatch: MenuOverride = {
  available: true,
  price: 8.95,
  name: "Classic Beef Pho",
  description: "Rice noodles in beef broth.",
  soldOutOptionIds: [],
};

describe("diffOverride", () => {
  it("no-op save (all fields resent unchanged) → no changes", () => {
    expect(diffOverride(base, {}, unchangedPatch)).toEqual([]);
  });

  it("equal price round-trip 8.95→8.95 is not a change", () => {
    const changes = diffOverride(base, {}, { ...unchangedPatch, price: 8.95 });
    expect(changes).toEqual([]);
  });

  it("price change reports formatted from→to", () => {
    const changes = diffOverride(base, {}, { ...unchangedPatch, price: 9.5 });
    expect(changes).toEqual([{ label: "Price", from: "$8.95", to: "$9.50" }]);
  });

  it("name and description changes report quoted from→to", () => {
    const changes = diffOverride(base, {}, {
      ...unchangedPatch,
      name: "Beef Pho Special",
      description: "Now with extra herbs.",
    });
    expect(changes).toEqual([
      { label: "Name", from: '"Classic Beef Pho"', to: '"Beef Pho Special"' },
      {
        label: "Description",
        from: '"Rice noodles in beef broth."',
        to: '"Now with extra herbs."',
      },
    ]);
  });

  it("description cleared to empty renders (empty), not a no-op", () => {
    const changes = diffOverride(base, {}, { ...unchangedPatch, description: "" });
    expect(changes).toEqual([
      { label: "Description", from: '"Rice noodles in beef broth."', to: "(empty)" },
    ]);
  });

  it("availability is tri-state: first sold-out edit logs Available→Sold out", () => {
    // base.available is undefined (= available); prev override empty.
    const changes = diffOverride(base, {}, { ...unchangedPatch, available: false });
    expect(changes).toEqual([
      { label: "Availability", from: "Available", to: "Sold out" },
    ]);
  });

  it("first edit that re-asserts availability=true is NOT a phantom change", () => {
    const changes = diffOverride(base, {}, { available: true });
    expect(changes).toEqual([]);
  });

  it("options newly sold out are reported by human label", () => {
    const changes = diffOverride(base, {}, {
      ...unchangedPatch,
      soldOutOptionIds: ["large", "extra-beef"],
    });
    expect(changes).toEqual([
      { label: "Options sold out", detail: "Large, Extra beef" },
    ]);
  });

  it("options restored are reported separately, set-based (order-insensitive)", () => {
    const prev: MenuOverride = { soldOutOptionIds: ["small", "large"] };
    const changes = diffOverride(base, prev, {
      ...unchangedPatch,
      soldOutOptionIds: ["large"],
    });
    expect(changes).toEqual([
      { label: "Options back in stock", detail: "Small" },
    ]);
  });

  it("compares against the prior OVERRIDE value, not the base, when one exists", () => {
    const prev: MenuOverride = { price: 9.5, name: "Renamed Pho" };
    const changes = diffOverride(base, prev, {
      ...unchangedPatch,
      price: 9.5, // same as prev override → no price change
      name: "Renamed Pho", // same as prev override → no name change
    });
    expect(changes).toEqual([]);
  });

  it("mixed edit collects every real change in field order", () => {
    const changes = diffOverride(base, {}, {
      ...unchangedPatch,
      available: false,
      price: 10,
      name: "Beef Pho XL",
      soldOutOptionIds: ["large"],
    });
    expect(changes.map((c) => c.label)).toEqual([
      "Availability",
      "Price",
      "Name",
      "Options sold out",
    ]);
  });
});

describe("summarizeChanges", () => {
  it("renders from→to, detail, and label-only forms into one line", () => {
    const line = summarizeChanges([
      { label: "Price", from: "$8.95", to: "$9.50" },
      { label: "Options sold out", detail: "Large" },
    ]);
    expect(line).toBe("Price $8.95 → $9.50, Options sold out: Large");
  });

  it("empty changes → empty string", () => {
    expect(summarizeChanges([])).toBe("");
  });
});
