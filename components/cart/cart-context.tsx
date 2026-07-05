"use client";

import { computeCartTotals, computeUnitPrice } from "@/lib/pricing";
import { TAX_RATE } from "@/lib/config";
import type { AddonOption, CartItem, MenuItem, SizeOption } from "@/lib/types";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

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
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
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

