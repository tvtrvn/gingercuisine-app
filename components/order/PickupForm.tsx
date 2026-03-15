"use client";

import { useCart } from "@/components/cart/cart-context";
import { PaymentMethod } from "@/lib/types";
import { orderRequestSchema } from "@/lib/validation";
import { FormEvent, useState } from "react";

const PICKUP_START_TIME = "11:30";
const PICKUP_END_TIME = "22:45";

interface PickupFormProps {
  onOrderCreated?: (orderId: string) => void;
}

export function PickupForm({ onOrderCreated }: PickupFormProps) {
  const { items, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupTimeOption, setPickupTimeOption] =
    useState<"asap" | "later">("asap");
  const [pickupTime, setPickupTime] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("pay_at_pickup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      items,
      pickupDetails: {
        name,
        phone,
        email,
        pickupTimeOption,
        pickupTime: pickupTimeOption === "later" ? pickupTime : undefined,
      },
      paymentMethod,
    };

    const parsed = orderRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message ?? "Please review your details.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (paymentMethod === "pay_at_pickup") {
        const res = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) {
          throw new Error("Failed to place order.");
        }
        const data = await res.json();
        clearCart();
        if (onOrderCreated && data.orderId) {
          onOrderCreated(data.orderId);
        }
        window.location.href = `/order/confirmation?orderId=${encodeURIComponent(
          data.orderId,
        )}`;
      } else {
        const res = await fetch("/api/order/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) {
          throw new Error("Failed to create Stripe checkout.");
        }
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("Stripe checkout URL missing.");
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong while submitting your order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
        Pickup details
      </h2>
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="pickup-name"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Name
          </label>
          <input
            id="pickup-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          />
        </div>
        <div>
          <label
            htmlFor="pickup-phone"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Phone
          </label>
          <input
            id="pickup-phone"
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="pickup-email"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Email (optional)
        </label>
        <input
          id="pickup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-neutral-700">
          Pickup time
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPickupTimeOption("asap")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              pickupTimeOption === "asap"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-100 text-neutral-800"
            }`}
          >
            ASAP
          </button>
          <button
            type="button"
            onClick={() => setPickupTimeOption("later")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              pickupTimeOption === "later"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-100 text-neutral-800"
            }`}
          >
            Choose a time
          </button>
        </div>
        {pickupTimeOption === "later" && (
          <div className="pt-2">
            <label
              htmlFor="pickup-time"
              className="mb-1 block text-xs text-neutral-700"
            >
              Desired pickup time
            </label>
            <input
              id="pickup-time"
              type="time"
              min={PICKUP_START_TIME}
              max={PICKUP_END_TIME}
              step={900}
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full rounded-full border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
            />
            <p className="mt-1 text-[11px] text-neutral-600">
              Available pickup times: 11:30 AM - 10:45 PM
            </p>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-neutral-700">
          Payment
        </legend>
        <p className="text-xs text-neutral-600">
          You can pay at pickup or securely online with Stripe Checkout.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("pay_at_pickup")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              paymentMethod === "pay_at_pickup"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-100 text-neutral-800"
            }`}
          >
            Pay at pickup
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("stripe")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              paymentMethod === "stripe"
                ? "bg-emerald-600 text-white"
                : "bg-neutral-100 text-neutral-800"
            }`}
          >
            Pay with card (Stripe)
          </button>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting || items.length === 0}
        className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {isSubmitting
          ? paymentMethod === "stripe"
            ? "Redirecting to Stripe…"
            : "Placing order…"
          : paymentMethod === "stripe"
            ? "Checkout with card"
            : "Place order"}
      </button>
    </form>
  );
}

