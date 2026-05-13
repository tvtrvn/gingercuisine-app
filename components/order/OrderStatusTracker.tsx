"use client";

import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 10_000;

export interface OrderStatusPayload {
  orderStatus: OrderStatus;
  acknowledgedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

interface OrderStatusTrackerProps {
  orderId: string;
  token: string;
  initialStatus: OrderStatusPayload;
}

export function OrderStatusTracker({
  orderId,
  token,
  initialStatus,
}: OrderStatusTrackerProps) {
  const [status, setStatus] = useState<OrderStatusPayload>(initialStatus);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () =>
      setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const idRef: {
      current: ReturnType<typeof setInterval> | null;
    } = { current: null };
    let cancelled = false;

    async function tick() {
      if (!visible || cancelled) return;

      try {
        const qs = new URLSearchParams({ orderId, token }).toString();
        const res = await fetch(`/api/order/status?${qs}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as OrderStatusPayload;
        if (cancelled) return;
        setStatus(data);
        if (
          data.orderStatus === "completed" ||
          data.orderStatus === "cancelled"
        ) {
          if (idRef.current) {
            clearInterval(idRef.current);
            idRef.current = null;
          }
        }
      } catch {
        /* ignore */
      }
    }

    idRef.current = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (idRef.current) clearInterval(idRef.current);
    };
  }, [orderId, token, visible]);

  if (status.orderStatus === "cancelled") {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        role="status"
      >
        <p className="font-semibold">This order has been cancelled.</p>
        <p className="mt-1 text-xs text-red-800">
          If this is a mistake, call the restaurant with your order number.
        </p>
      </div>
    );
  }

  const o = status.orderStatus;
  const acknowledged =
    o === "acknowledged" || o === "ready" || o === "completed";
  const ready = o === "ready" || o === "completed";

  const steps = [
    {
      id: "placed",
      title: "Placed",
      subtitle: "Restaurant received",
      done: true,
      active: true,
    },
    {
      id: "ack",
      title: "Acknowledged",
      subtitle: status.acknowledgedAt
        ? new Date(status.acknowledgedAt).toLocaleTimeString()
        : "Pending",
      done: acknowledged,
      active: acknowledged && o !== "ready" && o !== "completed",
    },
    {
      id: "ready",
      title: "Ready",
      subtitle: status.readyAt
        ? new Date(status.readyAt).toLocaleTimeString()
        : "Not yet",
      done: ready,
      active: ready && o !== "completed",
    },
  ] as const;

  return (
    <section
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)]"
      aria-labelledby="order-status-heading"
    >
      <h2
        id="order-status-heading"
        className="text-sm font-semibold tracking-tight text-neutral-900"
      >
        Order status
      </h2>
      {o === "completed" ? (
        <p className="mt-1 text-xs text-neutral-600">
          Order ready for pickup — see you at the counter.
        </p>
      ) : (
        <p className="mt-1 text-xs text-neutral-600">
          This page refreshes automatically about every ten seconds — keep it
          open to see updates.
        </p>
      )}

      <div className="mt-6">
        <div className="relative flex justify-between px-1">
          <div className="absolute left-0 right-0 top-[15px] mx-8 h-0.5 bg-neutral-200" />
          <div
            className="absolute left-0 top-[15px] mx-8 h-0.5 bg-brand-600 transition-all duration-200 ease-out"
            style={{
              width:
                o === "completed"
                  ? "100%"
                  : ready
                    ? "75%"
                    : acknowledged
                      ? "38%"
                      : "12%",
            }}
          />
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="relative z-[1] flex max-w-[33%] flex-1 flex-col items-center text-center"
            >
              <span
                className={cn(
                  "mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-200",
                  step.done
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-neutral-300 bg-white text-neutral-400",
                )}
              >
                {step.done ? (
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                ) : (
                  <span className="text-[11px] tabular-nums">{i + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold transition-colors duration-200",
                  step.done || step.active
                    ? "text-neutral-900"
                    : "text-neutral-500",
                )}
              >
                {step.title}
              </span>
              <span className="mt-0.5 hidden text-[10px] text-neutral-500 sm:block">
                {step.subtitle}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
