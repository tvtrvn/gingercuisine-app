import { CURRENCY } from "@/lib/config";
import { getOrderById } from "@/lib/orderStore";
import { formatCurrency } from "@/lib/utils";

interface ConfirmationPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const orderId = params.orderId;
  const order = orderId ? await getOrderById(orderId) : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Thank you for your order
        </h1>
        {orderId && (
          <p className="text-sm text-neutral-700">
            Your order number is{" "}
            <span className="font-semibold text-neutral-900">{orderId}</span>.
          </p>
        )}
        {!order && (
          <p className="text-sm text-neutral-700">
            We&apos;ve received your order. A confirmation has been sent to the
            restaurant.
          </p>
        )}
      </header>

      {order && (
        <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
              Pickup details
            </h2>
            <p className="mt-1 text-sm text-neutral-700">
              {order.pickupDetails.name} · {order.pickupDetails.phone}
            </p>
            {order.pickupDetails.email && (
              <p className="text-xs text-neutral-600">
                {order.pickupDetails.email}
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-600">
              Pickup time:{" "}
              {order.pickupDetails.pickupTimeOption === "asap"
                ? "ASAP"
                : order.pickupDetails.pickupTime || "later today"}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
              Items
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {order.items.map((item) => {
                const unitPrice = item.unitPrice ?? item.price;
                return (
                  <li key={item.id} className="border-b border-neutral-100 pb-2 last:border-none last:pb-0">
                  <div className="flex justify-between gap-2">
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(unitPrice * item.quantity, CURRENCY)}
                    </span>
                  </div>
                  {item.selectedSize && (
                    <p className="mt-1 text-xs text-neutral-600">
                      Size: {item.selectedSize.label}
                    </p>
                  )}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-600">
                      Add-ons:{" "}
                      {item.selectedAddons
                        .map((addon) => `${addon.name} (+${formatCurrency(addon.price)})`)
                        .join(", ")}
                    </p>
                  )}
                  {item.notes && (
                    <p className="mt-1 text-xs text-neutral-600">
                      Notes: {item.notes}
                    </p>
                  )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-1 border-t border-neutral-100 pt-3 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span>{formatCurrency(order.totals.subtotal, CURRENCY)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Tax</span>
              <span>{formatCurrency(order.totals.tax, CURRENCY)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span>{formatCurrency(order.totals.total, CURRENCY)}</span>
            </div>
            <p className="pt-2 text-xs text-neutral-600">
              Payment method:{" "}
              {order.paymentMethod === "stripe" ? "Paid online" : "Pay at pickup"}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

