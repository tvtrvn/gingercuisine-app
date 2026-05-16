"use client";

import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  PAY_IN_PERSON_NOTICE,
  PHONE_DEFAULT_REGION,
  PRICES_NOTICE,
} from "@/lib/config";
import { rememberOrder } from "@/lib/recentOrders";
import { orderRequestSchema } from "@/lib/validation";
import type { CountryCode } from "libphonenumber-js";
import { AsYouType } from "libphonenumber-js/min";
import { FormEvent, useMemo, useState } from "react";
import type { OrderingAvailabilityResponse } from "./useOrderingAvailability";

const PICKUP_START_TIME = "11:30";
const PICKUP_END_TIME = "22:45";
/** ITU-T E.164 max subscriber length; keeps paste from exploding state. */
const MAX_PHONE_DIGITS = 15;

function digitsFromTelInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);
}

/** Format digits with AsYouType so backspace deletes a digit (not fight parens). */
function formatDigitsForDisplay(digits: string, region: CountryCode): string {
  const ayt = new AsYouType(region);
  let formatted = "";
  for (const ch of digits) {
    formatted = ayt.input(ch);
  }
  return formatted;
}

interface PickupFormProps {
  onOrderCreated?: (orderId: string) => void;
  /**
   * Current ordering availability snapshot. When `accepting === false`, the
   * submit button is disabled and the form shows the closure reason inline.
   * Passing `null` (initial load) keeps the form interactive — the server
   * still enforces hours via `/api/order`.
   */
  availability?: OrderingAvailabilityResponse | null;
}

export function PickupForm({
  onOrderCreated,
  availability,
}: PickupFormProps) {
  const { items, clearCart } = useCart();
  const isAcceptingOrders = availability ? availability.accepting : true;
  const closedMessage =
    availability && !availability.accepting
      ? availability.message ?? "We're not accepting online orders right now."
      : null;
  const [name, setName] = useState("");
  /** National digits only; display is derived (see phoneDisplayValue). */
  const [phoneDigits, setPhoneDigits] = useState("");
  const phoneDisplayValue = useMemo(
    () => formatDigitsForDisplay(phoneDigits, PHONE_DEFAULT_REGION),
    [phoneDigits],
  );
  const [email, setEmail] = useState("");
  const [pickupTimeOption, setPickupTimeOption] =
    useState<"asap" | "later">("asap");
  const [pickupTime, setPickupTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!isAcceptingOrders) {
      setFormError(
        closedMessage ?? "We're not accepting online orders right now.",
      );
      return;
    }

    const selections = items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes,
      selectedSizeId: item.selectedSize?.id,
      selectedAddonIds: item.selectedAddons?.map((a) => a.id),
      selectedFlavorId: item.selectedFlavor?.id,
    }));

    const payload = {
      items: selections,
      pickupDetails: {
        name,
        phone: phoneDigits,
        email,
        pickupTimeOption,
        pickupTime: pickupTimeOption === "later" ? pickupTime : undefined,
      },
    };

    const parsed = orderRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const nextFields: Record<string, string> = {};
      let itemsMsg: string | null = null;
      for (const issue of parsed.error.issues) {
        const p = issue.path;
        if (p[0] === "pickupDetails" && typeof p[1] === "string") {
          const key = p[1];
          if (!nextFields[key]) nextFields[key] = issue.message;
        } else if (p[0] === "items" || p.length === 0) {
          itemsMsg = issue.message;
        }
      }
      setFieldErrors(nextFields);
      setFormError(itemsMsg ?? parsed.error.issues[0]?.message ?? "Please review your details.");
      return;
    }

    if (items.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        // 503 from the server means hours/pause closed the window between
        // the page render and the submit. Surface the server message instead
        // of the generic error so customers see why.
        if (res.status === 503) {
          let serverMessage: string | null = null;
          try {
            const data = (await res.json()) as { error?: string };
            if (typeof data?.error === "string") serverMessage = data.error;
          } catch {
            // ignore
          }
          setFormError(
            serverMessage ??
              "We're not accepting online orders right now. Please try again later.",
          );
          return;
        }
        throw new Error("Failed to place order.");
      }
      const data = await res.json();
      clearCart();
      if (data.viewToken) {
        rememberOrder({
          orderId: data.orderId,
          token: data.viewToken,
          placedAt: new Date().toISOString(),
        });
      }
      if (onOrderCreated && data.orderId) {
        onOrderCreated(data.orderId);
      }
      const tokenParam = data.viewToken
        ? `&token=${encodeURIComponent(data.viewToken)}`
        : "";
      window.location.href = `/order/confirmation?orderId=${encodeURIComponent(
        data.orderId,
      )}${tokenParam}`;
    } catch (err) {
      console.error(err);
      setFormError(
        "Something went wrong while submitting your order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-disabled={!isAcceptingOrders || undefined}
    >
      <h2 className="text-base font-semibold tracking-tight text-neutral-900">
        Pickup details
      </h2>
      {closedMessage && (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${
            availability?.reason === "paused"
              ? "border-amber-300 bg-amber-50 text-amber-950"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
          role="status"
        >
          {closedMessage}
        </p>
      )}
      {formError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {formError}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="pickup-name"
          label="Name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearFieldError("name");
          }}
          error={fieldErrors.name}
        />
        <Input
          id="pickup-phone"
          label="Phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          value={phoneDisplayValue}
          onChange={(e) => {
            const raw = e.target.value;
            const nextDigits = digitsFromTelInput(raw);
            if (
              nextDigits === phoneDigits &&
              raw.length < phoneDisplayValue.length
            ) {
              setPhoneDigits(phoneDigits.slice(0, -1));
            } else {
              setPhoneDigits(nextDigits);
            }
            clearFieldError("phone");
          }}
          error={fieldErrors.phone}
        />
      </div>
      <Input
        id="pickup-email"
        label="Email (optional)"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          clearFieldError("email");
        }}
        error={fieldErrors.email}
      />

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-neutral-700">
          Pickup time
        </legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPickupTimeOption("asap");
              clearFieldError("pickupTime");
            }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors duration-200 ${
              pickupTimeOption === "asap"
                ? "bg-brand-600 text-white shadow-sm"
                : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            ASAP
          </button>
          <button
            type="button"
            onClick={() => setPickupTimeOption("later")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors duration-200 ${
              pickupTimeOption === "later"
                ? "bg-brand-600 text-white shadow-sm"
                : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            Choose a time
          </button>
        </div>
        {pickupTimeOption === "later" && (
          <div className="pt-1">
            <label
              htmlFor="pickup-time"
              className="mb-1.5 block text-xs font-medium text-neutral-700"
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
              onChange={(e) => {
                setPickupTime(e.target.value);
                clearFieldError("pickupTime");
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
              aria-invalid={fieldErrors.pickupTime ? true : undefined}
            />
            {fieldErrors.pickupTime && (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.pickupTime}</p>
            )}
            <p className="mt-1.5 text-[11px] text-neutral-600">
              Available pickup times: 11:30 AM - 10:45 PM
            </p>
          </div>
        )}
      </fieldset>

      <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-950">
        <p className="font-semibold">Pay in person at pickup</p>
        <p className="mt-1 text-xs leading-relaxed text-brand-900/90">
          {PAY_IN_PERSON_NOTICE}
        </p>
        <p className="mt-2 text-center text-[11px] text-brand-800/80">
          {PRICES_NOTICE}
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        disabled={items.length === 0 || !isAcceptingOrders}
      >
        {isAcceptingOrders
          ? "Place pickup order"
          : availability?.reason === "paused"
            ? "Ordering paused"
            : "Outside ordering hours"}
      </Button>
    </form>
  );
}
