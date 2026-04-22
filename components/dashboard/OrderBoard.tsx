"use client";

import {
  ACTIVE_ORDER_STATUSES,
  Order,
  OrderStatus,
  PosEntryStatus,
} from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NewOrderToast } from "./NewOrderToast";
import { OrderCard } from "./OrderCard";
import { OrderDetailsDrawer } from "./OrderDetailsDrawer";

type SortMode = "newest" | "oldest" | "pickup";
type ScopeMode = "active" | "all";

const COLUMN_DEFS: { status: OrderStatus; label: string; accent: string }[] = [
  { status: "new", label: "New", accent: "from-rose-100 to-white" },
  {
    status: "acknowledged",
    label: "Acknowledged",
    accent: "from-amber-100 to-white",
  },
  { status: "preparing", label: "Preparing", accent: "from-sky-100 to-white" },
  { status: "ready", label: "Ready", accent: "from-emerald-100 to-white" },
  {
    status: "completed",
    label: "Completed",
    accent: "from-neutral-100 to-white",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    accent: "from-neutral-200 to-white",
  },
];

interface OrderBoardProps {
  initialOrders: Order[];
  pollIntervalMs: number;
}

export function OrderBoard({
  initialOrders,
  pollIntervalMs,
}: OrderBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [scope, setScope] = useState<ScopeMode>("active");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toastOrder, setToastOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<string>(
    new Date().toISOString(),
  );
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Track every order ID ever seen so we can detect genuinely new orders
  // without firing a toast on reload or for orders seen on a prior poll.
  const seenIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id)),
  );
  // Track which new-order toasts we have already shown this session to avoid
  // duplicate notifications if the same order reappears across filters.
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const playChime = useCallback(() => {
    try {
      const AudioCtx =
        typeof window !== "undefined"
          ? (window.AudioContext ||
              (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext)
          : undefined;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1318, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // ignore — chime is best-effort.
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/dashboard/orders?scope=all&limit=200`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        orders: Order[];
        serverTime: string;
      };
      setOrders(data.orders);
      setLastFetchAt(data.serverTime);
      setFetchError(null);

      // Detect brand-new orders (placed since board mounted) and notify once.
      const freshNewOrders = data.orders
        .filter(
          (o) =>
            !seenIdsRef.current.has(o.id) &&
            o.orderStatus === "new" &&
            !notifiedIdsRef.current.has(o.id),
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

      data.orders.forEach((o) => seenIdsRef.current.add(o.id));

      if (freshNewOrders.length > 0) {
        const latest = freshNewOrders[freshNewOrders.length - 1];
        notifiedIdsRef.current.add(latest.id);
        setToastOrder(latest);
        playChime();
      }
    } catch (err) {
      console.error("[OrderBoard] poll failed:", err);
      setFetchError("Couldn’t refresh orders. Retrying…");
    } finally {
      setIsFetching(false);
    }
  }, [playChime]);

  useEffect(() => {
    const id = setInterval(fetchOrders, pollIntervalMs);
    const onFocus = () => fetchOrders();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchOrders, pollIntervalMs]);

  const patchOrder = useCallback(
    async (
      orderId: string,
      body: {
        orderStatus?: OrderStatus;
        posEntryStatus?: PosEntryStatus;
      },
    ) => {
      setUpdatingId(orderId);
      // Optimistic update.
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...body } : o)),
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, ...body } : prev,
      );

      try {
        const res = await fetch(`/api/dashboard/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { order: Order };
        setOrders((prev) =>
          prev.map((o) => (o.id === data.order.id ? data.order : o)),
        );
        setSelectedOrder((prev) =>
          prev && prev.id === data.order.id ? data.order : prev,
        );
      } catch (err) {
        console.error("[OrderBoard] patch failed:", err);
        // Refetch to restore truth.
        fetchOrders();
      } finally {
        setUpdatingId(null);
      }
    },
    [fetchOrders],
  );

  const handleUpdateStatus = useCallback(
    (orderId: string, next: OrderStatus) => {
      patchOrder(orderId, { orderStatus: next });
    },
    [patchOrder],
  );

  const handleTogglePos = useCallback(
    (orderId: string, next: PosEntryStatus) => {
      patchOrder(orderId, { posEntryStatus: next });
    },
    [patchOrder],
  );

  const handleCancelOrder = useCallback(
    (orderId: string) => {
      patchOrder(orderId, { orderStatus: "cancelled" });
      setSelectedOrder(null);
    },
    [patchOrder],
  );

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = orders;

    if (scope === "active") {
      list = list.filter((o) =>
        ACTIVE_ORDER_STATUSES.includes(o.orderStatus),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((o) => o.orderStatus === statusFilter);
    }
    if (term) {
      list = list.filter((o) => {
        return (
          o.id.toLowerCase().includes(term) ||
          o.pickupDetails.name.toLowerCase().includes(term) ||
          o.pickupDetails.phone.toLowerCase().includes(term)
        );
      });
    }

    const sorted = [...list];
    if (sortMode === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortMode === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } else {
      // pickup: ASAP first, then by pickupTime string; fallback to newest.
      sorted.sort((a, b) => {
        const aKey =
          a.pickupDetails.pickupTimeOption === "asap"
            ? "00:00"
            : a.pickupDetails.pickupTime ?? "99:99";
        const bKey =
          b.pickupDetails.pickupTimeOption === "asap"
            ? "00:00"
            : b.pickupDetails.pickupTime ?? "99:99";
        return aKey.localeCompare(bKey);
      });
    }
    return sorted;
  }, [orders, scope, statusFilter, search, sortMode]);

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = {
      new: 0,
      acknowledged: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      c[o.orderStatus] = (c[o.orderStatus] ?? 0) + 1;
    }
    return c;
  }, [orders]);

  const visibleColumns = useMemo(() => {
    if (scope === "active") {
      return COLUMN_DEFS.filter((c) =>
        ACTIVE_ORDER_STATUSES.includes(c.status),
      );
    }
    return COLUMN_DEFS;
  }, [scope]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScope("active")}
              className={`rounded-full px-3 py-1.5 ${
                scope === "active"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600"
              }`}
            >
              Active only
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`rounded-full px-3 py-1.5 ${
                scope === "all"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600"
              }`}
            >
              All orders
            </button>
          </div>

          <label className="text-xs font-medium text-neutral-600">
            Status
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "all")
              }
              className="ml-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="all">All</option>
              {COLUMN_DEFS.map((c) => (
                <option key={c.status} value={c.status}>
                  {c.label} ({counts[c.status] ?? 0})
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-neutral-600">
            Sort
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="ml-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="pickup">By pickup time</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search name, phone or order #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 rounded-full border border-neutral-300 px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
          <button
            type="button"
            onClick={fetchOrders}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                fetchError
                  ? "bg-rose-500"
                  : isFetching
                    ? "bg-amber-500 animate-pulse"
                    : "bg-emerald-500"
              }`}
              aria-hidden
            />
            Refresh
          </button>
          <p className="text-[11px] text-neutral-500">
            Last sync {new Date(lastFetchAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {fetchError && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {fetchError}
        </p>
      )}

      {/* Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visibleColumns.map((col) => {
          const columnOrders = filteredOrders.filter(
            (o) => o.orderStatus === col.status,
          );
          return (
            <section
              key={col.status}
              className={`flex flex-col rounded-2xl border border-neutral-200 bg-gradient-to-b ${col.accent} p-3`}
              aria-label={`${col.label} orders`}
            >
              <header className="mb-2 flex items-center justify-between gap-2 px-1">
                <h2 className="text-sm font-bold tracking-wide text-neutral-900 uppercase">
                  {col.label}
                </h2>
                <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">
                  {columnOrders.length}
                </span>
              </header>
              <div className="space-y-3">
                {columnOrders.length === 0 && (
                  <p className="rounded-xl border border-dashed border-neutral-300 bg-white/50 px-3 py-6 text-center text-xs text-neutral-500">
                    No orders
                  </p>
                )}
                {columnOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isNewUnacknowledged={order.orderStatus === "new"}
                    onOpenDetails={(o) => setSelectedOrder(o)}
                    onUpdateStatus={handleUpdateStatus}
                    onTogglePos={handleTogglePos}
                    disabled={updatingId === order.id}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onTogglePos={handleTogglePos}
        onCancelOrder={handleCancelOrder}
      />

      <NewOrderToast
        order={toastOrder}
        onDismiss={() => setToastOrder(null)}
        onView={(o) => {
          setToastOrder(null);
          setSelectedOrder(o);
        }}
      />
    </div>
  );
}
