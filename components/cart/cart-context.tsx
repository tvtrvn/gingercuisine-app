"use client";

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
    },
  ) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  lastAddedMessage: string | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedMessage, setLastAddedMessage] = useState<string | null>(null);
  const clearMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addItem = useCallback(
    (
      menuItem: MenuItem,
      options?: {
        selectedAddons?: AddonOption[];
        selectedSize?: SizeOption;
      },
    ) => {
      const availableSizes = menuItem.availableSizes ?? [];
      const fallbackSize =
        options?.selectedSize ||
        availableSizes.find((size) => size.id === menuItem.defaultSizeId) ||
        availableSizes[0];
      const selectedAddons = options?.selectedAddons ?? [];
      const addonsTotal = selectedAddons.reduce(
        (sum, addon) => sum + addon.price,
        0,
      );
      const unitPrice = Number(
        (menuItem.price + (fallbackSize?.priceDelta ?? 0) + addonsTotal).toFixed(2),
      );
      const lineSignature = JSON.stringify({
        menuItemId: menuItem.id,
        sizeId: fallbackSize?.id ?? null,
        addonIds: selectedAddons.map((addon) => addon.id).sort(),
      });

      setItems((prev) => {
        const existing = prev.find((item) => {
          const itemSignature = JSON.stringify({
            menuItemId: item.menuItemId,
            sizeId: item.selectedSize?.id ?? null,
            addonIds: (item.selectedAddons ?? [])
              .map((addon) => addon.id)
              .sort(),
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
          selectedAddons,
          selectedSize: fallbackSize,
        };
        return [...prev, newItem];
      });

      const selectedSizeText = fallbackSize ? ` (${fallbackSize.label})` : "";
      setLastAddedMessage(`${menuItem.name}${selectedSizeText} added to cart`);
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

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.unitPrice ?? item.price) * item.quantity,
        0,
      ),
    [items],
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
    clearCart,
    subtotal,
    itemCount,
    lastAddedMessage,
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

