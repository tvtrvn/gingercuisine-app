"use client";

import type { OrderStatus } from "@/lib/types";
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

function Label({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        active ? "font-semibold text-emerald-900" : "text-neutral-500"
      }
    >
      {children}
    </span>
  );
}

function StepIcon({ done }: { done: boolean }) {
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
        done
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-neutral-300 bg-white text-neutral-400"
      }`}
      aria-hidden
    >
      {done ? "✓" : ""}
    </span>
  );
}

export function OrderStatusTracker({
  orderId,
  token,
  initialStatus,
}: OrderStatusTrackerProps) {
  const [status, setStatus] =
    useState<OrderStatusPayload>(initialStatus);
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
  const placed = true;
  const acknowledged =
    o === "acknowledged" || o === "ready" || o === "completed";
  const ready = o === "ready" || o === "completed";

  return (
    <section
      className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4"
      aria-labelledby="order-status-heading"
    >
      <h2
        id="order-status-heading"
        className="text-sm font-semibold tracking-tight text-emerald-950"
      >
        Order status
      </h2>
      {o === "completed" ? (
        <p className="mt-1 text-xs text-emerald-800">
          Order ready for pickup — see you at the counter.
        </p>
      ) : (
        <p className="mt-1 text-xs text-emerald-800">
          This page refreshes automatically about every ten seconds — keep it
          open to see updates.
        </p>
      )}
      <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <li className="flex gap-2">
          <StepIcon done={placed} />
          <div>
            <Label active={placed}>Placed</Label>
            <p className="text-[11px] text-neutral-600">
              Restaurant received
            </p>
          </div>
        </li>
        <li className="flex gap-2">
          <StepIcon done={acknowledged} />
          <div>
            <Label active={acknowledged}>Acknowledged</Label>
            <p className="text-[11px] text-neutral-600">
              {status.acknowledgedAt
                ? new Date(status.acknowledgedAt).toLocaleTimeString()
                : "Pending"}
            </p>
          </div>
        </li>
        <li className="flex gap-2">
          <StepIcon done={ready} />
          <div>
            <Label active={ready}>Ready</Label>
            <p className="text-[11px] text-neutral-600">
              {status.readyAt
                ? new Date(status.readyAt).toLocaleTimeString()
                : "Not yet"}
            </p>
          </div>
        </li>
      </ol>
    </section>
  );
}
