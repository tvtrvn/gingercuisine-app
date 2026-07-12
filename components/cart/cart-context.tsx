"use client";

import { computeCartTotals, computeUnitPrice } from "@/lib/pricing";
import { TAX_RATE } from "@/lib/config";
import type { AddonOption, CartItem, MenuItem, SizeOption } from "@/lib/types";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

/**
 * sessionStorage (NOT localStorage) by design: a reload should keep the cart,
 * but closing the tab / switching devices must NOT resurrect a stale "zombie"
 * cart — pricing and availability can change between sessions. Bumped suffix
 * (_v1) lets us invalidate old shapes on future schema changes.
 */
const CART_STORAGE_KEY = "gc_cart_v1";

/**
 * Defensively coerce a parsed sessionStorage blob back into CartItems. Anything
 * we can't trust (wrong shape, non-array, hostile quantity) is dropped rather
 * than trusted — the server re-prices every line on submit, but the client must
 * not render garbage. Returns [] for any non-array input.
 */
function sanitizeStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const clean: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      typeof e.menuItemId !== "string" ||
      typeof e.name !== "string" ||
      typeof e.quantity !== "number" ||
      !Number.isFinite(e.quantity) ||
      typeof e.unitPrice !== "number" ||
      !Number.isFinite(e.unitPrice)
    ) {
      continue;
    }
    const quantity = Math.min(99, Math.max(1, Math.floor(e.quantity)));
    // Preserve the rest of the line as-is; the fields above are the ones the
    // UI and the order payload actually depend on.
    clean.push({ ...(entry as CartItem), quantity });
  }
  return clean;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (
    menuItem: MenuItem,
    options?: {
      selectedAddons?: AddonOption[];
      selectedSize?: SizeOption;
      selectedFlavor?: AddonOption;
      notes?: string;
    },
  ) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  /** Effective tax rate — supplied by the server layout so the display total
   *  always matches what the server will charge. */
  taxRate: number;
  itemCount: number;
  lastAddedMessage: string | null;
  /** Mobile /order full checkout sheet (controlled by FloatingCart + Order page) */
  checkoutSheetOpen: boolean;
  setCheckoutSheetOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({
  children,
  // TAX_RATE reads process.env.TAX_RATE, which is NOT inlined into client
  // bundles — a server component must pass the real value down or the cart
  // silently falls back to the default while the server charges the env rate.
  taxRate = TAX_RATE,
}: {
  children: ReactNode;
  taxRate?: number;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedMessage, setLastAddedMessage] = useState<string | null>(null);
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const clearMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Gates the persist effect: don't write the empty initial state to storage
  // before the mount-time hydrate has had a chance to read it back.
  const hydratedRef = useRef(false);

  // Hydrate from sessionStorage AFTER mount (not in the useState initializer)
  // so server and first client render both start empty — no hydration mismatch.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const restored = sanitizeStoredCart(JSON.parse(stored));
        // Intentional post-mount setState: hydrating in the useState initializer
        // would diverge from the empty server render and cause a mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (restored.length > 0) setItems(restored);
      }
    } catch {
      // Corrupt/unparseable blob: clear it so it can't wedge every future load.
      try {
        sessionStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        // sessionStorage unavailable (private mode / disabled) — nothing to do.
      }
    }
    hydratedRef.current = true;
  }, []);

  // Persist on every cart change once hydration has run.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      if (items.length === 0) {
        sessionStorage.removeItem(CART_STORAGE_KEY);
      } else {
        sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch {
      // Storage unavailable or quota exceeded — cart still works in-memory.
    }
  }, [items]);

  const addItem = useCallback(
    (
      menuItem: MenuItem,
      options?: {
        selectedAddons?: AddonOption[];
        selectedSize?: SizeOption;
        selectedFlavor?: AddonOption;
        notes?: string;
      },
    ) => {
      const notesValue = (options?.notes ?? "").trim();
      const availableSizes = menuItem.availableSizes ?? [];
      const fallbackSize =
        options?.selectedSize ||
        availableSizes.find((size) => size.id === menuItem.defaultSizeId) ||
        availableSizes[0];
      const selectedAddons = options?.selectedAddons ?? [];
      const selectedFlavor = options?.selectedFlavor;
      const unitPrice = computeUnitPrice(
        menuItem,
        fallbackSize,
        selectedAddons,
        selectedFlavor,
      );
      const lineSignature = JSON.stringify({
        menuItemId: menuItem.id,
        sizeId: fallbackSize?.id ?? null,
        addonIds: selectedAddons.map((addon) => addon.id).sort(),
        flavorId: selectedFlavor?.id ?? null,
        notes: notesValue,
      });

      setItems((prev) => {
        const existing = prev.find((item) => {
          const itemSignature = JSON.stringify({
            menuItemId: item.menuItemId,
            sizeId: item.selectedSize?.id ?? null,
            addonIds: (item.selectedAddons ?? [])
              .map((addon) => addon.id)
              .sort(),
            flavorId: item.selectedFlavor?.id ?? null,
            notes: (item.notes ?? "").trim(),
          });
          return itemSignature === lineSignature;
        });
        if (existing) {
          return prev.map((item) =>
            item.id === existing.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }

        const newItem: CartItem = {
          id: `${menuItem.id}-${Date.now()}`,
          menuItemId: menuItem.id,
          name: menuItem.name,
          basePrice: menuItem.price,
          price: unitPrice,
          unitPrice,
          quantity: 1,
          notes: notesValue || undefined,
          selectedAddons,
          selectedSize: fallbackSize,
          selectedFlavor,
        };
        return [...prev, newItem];
      });

      const selectedSizeText = fallbackSize ? ` (${fallbackSize.label})` : "";
      const flavorText = selectedFlavor ? ` – ${selectedFlavor.name}` : "";
      setLastAddedMessage(`${menuItem.name}${flavorText}${selectedSizeText} added to cart`);
      if (clearMessageTimerRef.current) {
        clearTimeout(clearMessageTimerRef.current);
      }
      clearMessageTimerRef.current = setTimeout(() => {
        setLastAddedMessage(null);
      }, 2000);
    },
    [],
  );

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.min(99, Math.max(1, quantity)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const updateItemNotes = useCallback((id: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * Splits qty or duplicates a merged line so the copy can carry different notes
   * (subtracts one from source, inserts a second line qty 1 with empty notes).
   */
  const duplicateItem = useCallback((id: string) => {
    setItems((prev) => {
      const src = prev.find((i) => i.id === id);
      if (!src) return prev;
      const newLine: CartItem = {
        ...src,
        id: `${src.menuItemId}-${Date.now()}`,
        quantity: 1,
        notes: undefined,
      };
      const updated = prev.map((i) =>
        i.id === id
          ? { ...i, quantity: Math.max(1, i.quantity - 1) }
          : i,
      );
      return [...updated, newLine];
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const { subtotal, tax, total } = useMemo(
    () => computeCartTotals(items, taxRate),
    [items, taxRate],
  );
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    addItem,
    updateItemQuantity,
    updateItemNotes,
    removeItem,
    duplicateItem,
    clearCart,
    taxRate,
    subtotal,
    tax,
    total,
    itemCount,
    lastAddedMessage,
    checkoutSheetOpen,
    setCheckoutSheetOpen,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

