import {
  CURRENCY,
  PAY_IN_PERSON_NOTICE,
  PICKUP_READY_NOTICE,
  PRICES_NOTICE,
} from "@/lib/config";
import { getOrderById } from "@/lib/orderStore";
import { timingSafeEqualStr } from "@/lib/timingSafeString";
import { formatCurrency } from "@/lib/utils";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { OrderStatusTracker } from "@/components/order/OrderStatusTracker";

interface ConfirmationPageProps {
  searchParams: Promise<{ orderId?: string; token?: string }>;
}

function formatPhoneDisplay(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  return parsed?.formatNational() ?? e164;
}

export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const orderId = params.orderId;
  const token = params.token;

  const record = orderId ? await getOrderById(orderId) : undefined;
  const tokenOk =
    !!record &&
    !!record.viewToken &&
    !!token &&
    timingSafeEqualStr(record.viewToken, token);
  const order = tokenOk ? record : undefined;

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
        <p className="text-sm text-neutral-700">
          We&apos;ve received your order and sent it to the restaurant.{" "}
          <span className="font-medium">
            Please pay in person at the restaurant when you pick up your order.
          </span>
        </p>
        {order && (
          <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
            {PICKUP_READY_NOTICE}
          </p>
        )}
        <p className="text-xs text-neutral-500">{PRICES_NOTICE}</p>
      </header>

      {order && token && (
        <OrderStatusTracker
          orderId={order.id}
          token={token}
          initialStatus={{
            orderStatus: order.orderStatus,
            acknowledgedAt: order.acknowledgedAt ?? null,
            readyAt: order.readyAt ?? null,
            completedAt: order.completedAt ?? null,
            cancelledAt: order.cancelledAt ?? null,
          }}
        />
      )}

      {order && (
        <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
              Pickup details
            </h2>
            <p className="mt-1 text-sm text-neutral-700">
              {order.pickupDetails.name} ·{" "}
              {formatPhoneDisplay(order.pickupDetails.phone)}
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
                  <li
                    key={item.id}
                    className="border-b border-neutral-100 pb-2 last:border-none last:pb-0"
                  >
                    <div className="flex justify-between gap-2">
                      <span>
                        {item.quantity} × {item.name}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(unitPrice * item.quantity, CURRENCY)}
                      </span>
                    </div>
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
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <p className="font-semibold">Pay in person at pickup</p>
              <p className="mt-0.5 text-emerald-800">{PAY_IN_PERSON_NOTICE}</p>
            </div>
            <p className="pt-1 text-[11px] text-neutral-500">{PRICES_NOTICE}</p>
          </div>
        </section>
      )}
    </div>
  );
}
