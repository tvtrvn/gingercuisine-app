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
import { CopyOrderIdButton } from "@/components/order/CopyOrderIdButton";
import { Card, CardBody } from "@/components/ui/Card";
import { CheckCircle2 } from "lucide-react";

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
    <div className="space-y-8">
      <header className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50 to-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/25">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Thank you for your order
            </h1>
            {orderId && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-neutral-700">
                  Your order number:{" "}
                  <span className="font-mono font-bold text-neutral-900">
                    {orderId}
                  </span>
                </p>
                <CopyOrderIdButton orderId={orderId} />
              </div>
            )}
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
              We&apos;ve received your order and sent it to the restaurant.{" "}
              <span className="font-semibold text-neutral-900">
                Please pay in person at the restaurant when you pick up your
                order.
              </span>
            </p>
            {order && (
              <p className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-950">
                {PICKUP_READY_NOTICE}
              </p>
            )}
            <p className="text-xs text-neutral-500">{PRICES_NOTICE}</p>
          </div>
        </div>
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardBody className="space-y-3">
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                Next steps
              </h2>
              <ol className="list-decimal space-y-2 pl-4 text-sm leading-relaxed text-neutral-700">
                <li>We&apos;ll prepare your order for the pickup time you chose.</li>
                <li>
                  Watch the status bar above — it updates automatically every
                  few seconds.
                </li>
                <li>
                  Pay at the counter when you arrive (card or cash per
                  restaurant).
                </li>
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                  Pickup details
                </h2>
                <p className="mt-2 text-sm text-neutral-700">
                  {order.pickupDetails.name} ·{" "}
                  {formatPhoneDisplay(order.pickupDetails.phone)}
                </p>
                {order.pickupDetails.email && (
                  <p className="mt-1 text-xs text-neutral-600">
                    {order.pickupDetails.email}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-neutral-600">
                  Pickup time:{" "}
                  <span className="text-neutral-900">
                    {order.pickupDetails.pickupTimeOption === "asap"
                      ? "ASAP"
                      : order.pickupDetails.pickupTime || "Later today"}
                  </span>
                </p>
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                  Items
                </h2>
                <ul className="mt-3 space-y-3 text-sm">
                  {order.items.map((item) => {
                    const unitPrice = item.unitPrice ?? item.price;
                    return (
                      <li
                        key={item.id}
                        className="border-b border-neutral-100 pb-3 last:border-none last:pb-0"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-neutral-900">
                            {item.quantity} × {item.name}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-neutral-900">
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

              <div className="space-y-2 border-t border-neutral-100 pt-4 text-sm">
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(order.totals.subtotal, CURRENCY)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Tax</span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(order.totals.tax, CURRENCY)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-neutral-900">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.totals.total, CURRENCY)}
                  </span>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs text-brand-950">
                  <p className="font-semibold">Pay in person at pickup</p>
                  <p className="mt-0.5 text-brand-900/90">{PAY_IN_PERSON_NOTICE}</p>
                </div>
                <p className="pt-1 text-center text-[11px] text-neutral-500">
                  {PRICES_NOTICE}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
