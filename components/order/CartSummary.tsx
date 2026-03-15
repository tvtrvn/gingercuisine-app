import { useCart } from "@/components/cart/cart-context";
import { CURRENCY, TAX_RATE } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";

export function CartSummary() {
  const {
    items,
    subtotal,
    updateItemQuantity,
    updateItemNotes,
    removeItem,
  } = useCart();

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
        Your cart is empty. Browse the menu to add dishes.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
        Your order
      </h2>
      <ul className="space-y-3 text-sm">
        {items.map((item) => {
          const effectiveUnitPrice = item.unitPrice ?? item.price;
          return (
            <li
              key={item.id}
              className="space-y-2 border-b border-neutral-100 pb-3 last:border-none last:pb-0"
            >
              <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">{item.name}</p>
                <p className="text-xs text-neutral-600">
                  {formatCurrency(effectiveUnitPrice)} each
                </p>
                {item.selectedSize && (
                  <p className="mt-1 text-xs text-neutral-600">
                    Size: {item.selectedSize.label}
                  </p>
                )}
                {item.selectedAddons && item.selectedAddons.length > 0 && (
                  <p className="mt-1 text-xs text-neutral-600">
                    Add-ons:{" "}
                    {item.selectedAddons
                      .map(
                        (addon) =>
                          `${addon.name} (+${formatCurrency(addon.price)})`,
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-xs text-neutral-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-600" htmlFor={`qty-${item.id}`}>
                Qty
              </label>
              <input
                id={`qty-${item.id}`}
                type="number"
                min={1}
                inputMode="numeric"
                value={item.quantity}
                onChange={(e) =>
                  updateItemQuantity(item.id, Number(e.target.value) || 1)
                }
                className="h-8 w-16 rounded-full border border-neutral-300 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
              />
            </div>
            <div>
              <label
                htmlFor={`notes-${item.id}`}
                className="mb-1 block text-xs text-neutral-600"
              >
                Notes (e.g. “no cilantro”)
              </label>
              <textarea
                id={`notes-${item.id}`}
                value={item.notes ?? ""}
                onChange={(e) => updateItemNotes(item.id, e.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-neutral-300 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
              />
            </div>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1 border-t border-neutral-100 pt-3 text-sm">
        <div className="flex justify-between text-neutral-700">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, CURRENCY)}</span>
        </div>
        <div className="flex justify-between text-neutral-700">
          <span>Tax ({Math.round(TAX_RATE * 100)}%)</span>
          <span>{formatCurrency(tax, CURRENCY)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-neutral-900">
          <span>Total</span>
          <span>{formatCurrency(total, CURRENCY)}</span>
        </div>
      </div>
    </div>
  );
}

