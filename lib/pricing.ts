import { menuItems } from "@/data/menu";
import { TAX_RATE } from "./config";
import type {
  AddonOption,
  CartItem,
  MenuItem,
  OrderTotals,
  SizeOption,
} from "./types";

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute the unit price for a single configured menu line.
 * Pure function — same inputs always produce the same output.
 * This is the single source of truth: display path, cart reducer, and
 * server-side `priceCart` all delegate here so the customer never sees a
 * price that disagrees with the server total.
 */
export function computeUnitPrice(
  menuItem: MenuItem,
  selectedSize?: SizeOption,
  selectedAddons?: AddonOption[],
  selectedFlavor?: AddonOption,
): number {
  const sizeDelta = selectedSize?.priceDelta ?? 0;
  const addonsTotal = (selectedAddons ?? []).reduce(
    (sum, a) => sum + a.price,
    0,
  );
  const flavorPrice = selectedFlavor?.price ?? 0;
  return round2(menuItem.price + sizeDelta + addonsTotal + flavorPrice);
}

/**
 * Compute subtotal / tax / total from a list of already-priced cart lines.
 * Pure function — does not look up menu data. Caller is responsible for
 * having computed `unitPrice` via `computeUnitPrice` first.
 */
export function computeCartTotals(
  items: ReadonlyArray<{ unitPrice: number; quantity: number }>,
  taxRate: number,
): OrderTotals {
  const subtotal = round2(
    items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  );
  const tax = round2(subtotal * taxRate);
  const total = round2(subtotal + tax);
  return { subtotal, tax, total };
}

const menuById = new Map<string, MenuItem>(
  menuItems.map((m) => [m.id, m]),
);

/**
 * A minimal description of what the customer selected for a single line item.
 * We intentionally do NOT accept any `price`, `unitPrice`, or `basePrice`
 * fields from the client — those are recomputed here from `data/menu.ts`.
 */
export interface CartSelectionInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
  selectedSizeId?: string;
  selectedAddonIds?: string[];
  selectedFlavorId?: string;
}

// `PricedCartItem` is just a `CartItem` re-built by the server from trusted
// menu data. We keep the alias purely for readability at call sites.
export type PricedCartItem = CartItem;

export interface PricedOrder {
  items: PricedCartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Recompute the cart server-side from trusted menu data.
 * Throws `PricingError` if any referenced menu item / size / addon / flavor
 * doesn't exist or is not available for the chosen item.
 */
export function priceCart(selections: CartSelectionInput[]): PricedOrder {
  if (selections.length === 0) {
    throw new PricingError("Cart is empty.");
  }

  const items: PricedCartItem[] = selections.map((sel, idx) => {
    const menuItem = menuById.get(sel.menuItemId);
    if (!menuItem) {
      throw new PricingError(
        `Unknown menu item: "${sel.menuItemId}" (line ${idx + 1}).`,
      );
    }

    let size: SizeOption | undefined;
    if (menuItem.availableSizes && menuItem.availableSizes.length > 0) {
      const sizeId =
        sel.selectedSizeId ??
        menuItem.defaultSizeId ??
        menuItem.availableSizes[0]?.id;
      size = menuItem.availableSizes.find((s) => s.id === sizeId);
      if (!size) {
        throw new PricingError(
          `Invalid size "${sel.selectedSizeId}" for ${menuItem.name}.`,
        );
      }
    } else if (sel.selectedSizeId) {
      throw new PricingError(
        `${menuItem.name} does not have size options.`,
      );
    }

    let addons: AddonOption[] = [];
    if (sel.selectedAddonIds && sel.selectedAddonIds.length > 0) {
      const available = menuItem.availableAddons ?? [];
      addons = sel.selectedAddonIds.map((id) => {
        const match = available.find((a) => a.id === id);
        if (!match) {
          throw new PricingError(
            `Invalid add-on "${id}" for ${menuItem.name}.`,
          );
        }
        return match;
      });
    }

    let flavor: AddonOption | undefined;
    if (sel.selectedFlavorId) {
      const available = menuItem.availableFlavors ?? [];
      flavor = available.find((f) => f.id === sel.selectedFlavorId);
      if (!flavor) {
        throw new PricingError(
          `Invalid flavor "${sel.selectedFlavorId}" for ${menuItem.name}.`,
        );
      }
    }

    const unitPrice = computeUnitPrice(menuItem, size, addons, flavor);

    const priced: PricedCartItem = {
      id: `${menuItem.id}-${idx}`,
      menuItemId: menuItem.id,
      name: menuItem.name,
      basePrice: menuItem.price,
      price: unitPrice,
      unitPrice,
      quantity: sel.quantity,
      notes: sel.notes?.trim() ? sel.notes.trim() : undefined,
      selectedAddons: addons.length > 0 ? addons : undefined,
      selectedSize: size,
      selectedFlavor: flavor,
    };
    return priced;
  });

  return { items, ...computeCartTotals(items, TAX_RATE) };
}
