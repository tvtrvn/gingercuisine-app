import { useCart } from "@/components/cart/cart-context";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { CURRENCY, PAY_IN_PERSON_NOTICE } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export function CartSummary() {
  const {
    items,
    subtotal,
    tax,
    total,
    taxRate,
    updateItemQuantity,
    updateItemNotes,
    removeItem,
    duplicateItem,
  } = useCart();

  // Which lines have their note field revealed. Lines that already carry a note
  // are treated as open (see isNoteOpen) so an existing note is never hidden.
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  function isNoteOpen(id: string, hasNote: boolean) {
    return openNotes[id] ?? hasNote;
  }

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
                  <span className="text-xs font-medium text-neutral-600">
                    Qty
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        updateItemQuantity(item.id, item.quantity - 1)
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <span
                      className="w-9 text-center text-sm font-semibold tabular-nums text-neutral-900"
                      aria-live="polite"
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        updateItemQuantity(item.id, item.quantity + 1)
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {isNoteOpen(item.id, !!item.notes) ? (
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
                        onChange={(e) =>
                          updateItemNotes(item.id, e.target.value)
                        }
                        rows={2}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenNotes((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="text-xs font-medium text-brand-800 underline underline-offset-2 hover:text-brand-900"
                    >
                      Add note
                    </button>
                  )}
                  <p>
                    <button
                      type="button"
                      onClick={() => duplicateItem(item.id)}
                      className="text-[11px] font-medium text-brand-800 underline underline-offset-2 hover:text-brand-900"
                    >
                      Split one off for its own note
                    </button>
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
              <span>Tax ({Math.round(taxRate * 100)}%)</span>
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
        </div>
      </CardBody>
    </Card>
  );
}
