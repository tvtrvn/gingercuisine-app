import { useCart } from "@/components/cart/cart-context";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { CURRENCY, PAY_IN_PERSON_NOTICE, PRICES_NOTICE, TAX_RATE } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";

export function CartSummary() {
  const {
    items,
    subtotal,
    updateItemQuantity,
    updateItemNotes,
    removeItem,
    duplicateItem,
  } = useCart();

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-neutral-300 bg-neutral-50/80">
        <CardBody className="py-8 text-center text-sm text-neutral-600">
          Your cart is empty. Browse the menu to add dishes.
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-5 p-4 sm:p-5">
        <h2 className="text-base font-semibold tracking-tight text-neutral-900">
          Your order
        </h2>
        <ul className="space-y-4 text-sm">
          {items.map((item) => {
            const effectiveUnitPrice = item.unitPrice ?? item.price;
            return (
              <li
                key={item.id}
                className="space-y-3 border-b border-neutral-100 pb-4 last:border-none last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-600">
                      {formatCurrency(effectiveUnitPrice)} each
                    </p>
                    {item.selectedFlavor && (
                      <p className="mt-1 text-xs text-neutral-600">
                        Flavor: {item.selectedFlavor.name}
                      </p>
                    )}
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
                    className="shrink-0 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="text-xs font-medium text-neutral-600"
                    htmlFor={`qty-${item.id}`}
                  >
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
                    className="h-10 w-16 rounded-lg border border-neutral-300 px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`notes-${item.id}`}
                    className="mb-1.5 block text-xs font-medium text-neutral-600"
                  >
                    Notes (e.g. allergies, no cilantro)
                  </label>
                  <textarea
                    id={`notes-${item.id}`}
                    value={item.notes ?? ""}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                    <button
                      type="button"
                      onClick={() => duplicateItem(item.id)}
                      className="font-medium text-brand-800 underline underline-offset-2 hover:text-brand-900"
                    >
                      Add another with different notes
                    </button>
                    {" — "}
                    one unit splits off as a separate line (same price overall).
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success" dot className="text-xs">
              Pay in person at pickup
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-neutral-600">
            {PAY_IN_PERSON_NOTICE}
          </p>
          <div className="space-y-2 rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium">
                {formatCurrency(subtotal, CURRENCY)}
              </span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Tax ({Math.round(TAX_RATE * 100)}%)</span>
              <span className="tabular-nums font-medium">
                {formatCurrency(tax, CURRENCY)}
              </span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCurrency(total, CURRENCY)}
              </span>
            </div>
          </div>
          <p className="text-center text-[11px] text-neutral-500">{PRICES_NOTICE}</p>
        </div>
      </CardBody>
    </Card>
  );
}
