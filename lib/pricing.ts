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

// Round up to the next whole cent. Used for tax so a fractional cent
// (e.g. 18.95 * 0.13 = 2.4635) never rounds *down* and leaves the total short.
// The toFixed(6) collapses binary float noise (10 * 0.13 -> 1.3000000000000003)
// before ceiling so we don't over-round a value that is already a whole cent.
function ceil2(n: number): number {
  return Math.ceil(Number((n * 100).toFixed(6))) / 100;
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
  const tax = ceil2(subtotal * taxRate);
  const total = round2(subtotal + tax);
  return { subtotal, tax, total };
}

/**
 * A minimal description of what the customer selected for a single line item.
 * We intentionally do NOT accept any `price`, `unitPrice`, or `basePrice`
 * fields from the client — those are recomputed here from the trusted menu.
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
 * `menu` is the merged catalog (base ⊕ owner overrides ⊕ custom items) from
 * `getMenuItems()` — injected so this stays pure and unit-testable.
 * Throws `PricingError` if any referenced menu item / size / addon / flavor
 * doesn't exist, or is sold out / unavailable for the chosen item. This is the
 * authoritative sold-out gate: the client UI hiding is cosmetic.
 */
export function priceCart(
  selections: CartSelectionInput[],
  menu: MenuItem[],
): PricedOrder {
  if (selections.length === 0) {
    throw new PricingError("Cart is empty.");
  }

  const menuById = new Map<string, MenuItem>(menu.map((m) => [m.id, m]));

  const items: PricedCartItem[] = selections.map((sel, idx) => {
    const menuItem = menuById.get(sel.menuItemId);
    if (!menuItem) {
      throw new PricingError(
        `Unknown menu item: "${sel.menuItemId}" (line ${idx + 1}).`,
      );
    }
    if (menuItem.available === false) {
      throw new PricingError(`${menuItem.name} is sold out.`);
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
      if (size.soldOut) {
        throw new PricingError(
          `The "${size.label}" size for ${menuItem.name} is sold out.`,
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
        if (match.soldOut) {
          throw new PricingError(
            `The add-on "${match.name}" for ${menuItem.name} is sold out.`,
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
      if (flavor.soldOut) {
        throw new PricingError(
          `The "${flavor.name}" flavor for ${menuItem.name} is sold out.`,
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
